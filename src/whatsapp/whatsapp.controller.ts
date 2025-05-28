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

    try {
      switch (message.type) {
        case 'text':
          await this.handleTextMessage(messageSender, message.text.body);
          break;

        case 'interactive':
          await this.handleInteractiveMessage(
            messageSender,
            message.interactive,
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

  private async handleTextMessage(messageSender: string, text: string) {
    // Check if user typed "shop"
    if (text.toLowerCase().includes('shop')) {
      await this.whatsappService.sendCatalogOptions(messageSender);
    } else {
      // For any other message, send welcome message
      await this.whatsappService.sendWelcomeMessage(messageSender);
    }
  }

  private async handleInteractiveMessage(
    messageSender: string,
    interactive: any,
  ) {
    let responseId: string;

    // Handle button replies
    if (interactive.type === 'button_reply') {
      responseId = interactive.button_reply.id;
    }
    // Handle list replies
    else if (interactive.type === 'list_reply') {
      responseId = interactive.list_reply.id;
    } else {
      this.logger.log(`Unhandled interactive type: ${interactive.type}`);
      return;
    }

    // Handle category selections from the list (format: category_traditional, category_casual, etc.)
    if (responseId.startsWith('category_')) {
      const categoryId = responseId.replace('category_', '');
      await this.whatsappService.sendCategoryCatalogCard(
        messageSender,
        categoryId,
      );
    }
    // Handle "View items" button clicks (format: view_traditional, view_casual, etc.)
    else if (responseId.startsWith('view_')) {
      const categoryId = responseId.replace('view_', '');
      await this.whatsappService.sendCategoryProducts(
        messageSender,
        categoryId,
      );
    }
    // Handle back to categories button
    else if (responseId === 'back_to_categories') {
      await this.whatsappService.sendCatalogOptions(messageSender);
    }
    // Handle continue shopping button
    else if (responseId === 'continue_shopping') {
      await this.whatsappService.sendCatalogOptions(messageSender);
    } else {
      // For any unhandled response, send welcome message
      await this.whatsappService.sendWelcomeMessage(messageSender);
    }
  }
}
