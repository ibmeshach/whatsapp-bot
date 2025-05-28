import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';

import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('webhook')
  whatsappVerificationChallenge(@Req() request: Request) {
    const mode = request.query['hub.mode'];
    const challenge = request.query['hub.challenge'];
    const token = request.query['hub.verify_token'];

    const verificationToken =
      process.env.WHATSAPP_CLOUD_API_WEBHOOK_VERIFICATION_TOKEN;

    console.log(mode, token, verificationToken);

    if (!mode || !token) {
      return 'Error verifying token';
    }

    if (mode === 'subscribe' && token === verificationToken) {
      return challenge?.toString();
    }
  }

  @Post('webhook')
  @HttpCode(200)
  async handleIncomingWhatsappMessage(@Body() request: any) {
    const { messages } = request?.entry?.[0]?.changes?.[0]?.value ?? {};
    if (!messages) return;

    const message = messages[0];
    const messageSender = message.from;
    const messageID = message.id;

    try {
      switch (message.type) {
        case 'text':
          const text = message.text.body;

          // Try to find the aseobi type from the user's message
          const aseobiType = this.whatsappService.findAseobiType(text);

          if (aseobiType) {
            // If an aseobi type was found, send its products
            await this.whatsappService.sendAseobiProducts(
              messageSender,
              aseobiType,
            );
          } else {
            // If no aseobi type was found, send the welcome message
            await this.whatsappService.sendTextMessage(
              messageSender,
              this.whatsappService.getWelcomeMessage(),
            );
          }
          break;

        case 'image':
          // For images, send the welcome message
          await this.whatsappService.sendTextMessage(
            messageSender,
            this.whatsappService.getWelcomeMessage(),
          );
          break;

        default:
          this.logger.log(`Unhandled message type: ${message.type}`);
          return;
      }
    } catch (error) {
      this.logger.error('Error processing message:', error);
      throw new BadRequestException('Error processing message');
    }
  }
}
