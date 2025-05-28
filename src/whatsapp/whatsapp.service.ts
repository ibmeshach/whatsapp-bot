import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, lastValueFrom, map } from 'rxjs';
import { aseobiTypes, AseobiType } from './data/aseobi-data';

@Injectable()
export class WhatsappService {
  private readonly httpService = new HttpService();
  private readonly logger = new Logger(WhatsappService.name);

  private async sendMessage(url: string, config: any, data: any) {
    try {
      const response = this.httpService
        .post(url, data, config)
        .pipe(map((res) => res.data))
        .pipe(
          catchError((err) => {
            this.logger.error(err);
            throw new BadRequestException(
              'Error Posting To WhatsApp Cloud API',
            );
          }),
        );
      const messageSendingStatus = await lastValueFrom(response);
      this.logger.log('Message sent successfully', messageSendingStatus);
      return messageSendingStatus;
    } catch (error) {
      console.error(error);
      return 'Axle broke!! Abort mission';
    }
  }

  async sendTextMessage(messageSender: string, text: string) {
    const url = `https://graph.facebook.com/${process.env.WHATSAPP_CLOUD_API_VERSION}/${process.env.WHATSAPP_CLOUD_API_PHONE_NUMBER_ID}/messages`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_API_ACCESS_TOKEN}`,
      },
    };

    const data = JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: messageSender,
      type: 'text',
      text: {
        preview_url: false,
        body: text,
      },
    });

    return this.sendMessage(url, config, data);
  }

  async sendImageMessage(
    messageSender: string,
    imageUrl: string,
    caption?: string,
  ) {
    const url = `https://graph.facebook.com/${process.env.WHATSAPP_CLOUD_API_VERSION}/${process.env.WHATSAPP_CLOUD_API_PHONE_NUMBER_ID}/messages`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_API_ACCESS_TOKEN}`,
      },
    };

    const data = JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: messageSender,
      type: 'image',
      image: {
        link: imageUrl,
        caption: caption,
      },
    });

    return this.sendMessage(url, config, data);
  }

  getWelcomeMessage(): string {
    let message =
      'Welcome to MyAseobi! 👋\n\nHere are our available Aseobi types:\n\n';

    aseobiTypes.forEach((type, index) => {
      message += `${index + 1}. ${type.name}\n`;
      message += `   ${type.description}\n\n`;
    });

    message +=
      "Please reply with the number or name of the Aseobi type you're interested in.";
    return message;
  }

  findAseobiType(input: string): AseobiType | null {
    // Try to find by number
    const number = parseInt(input);
    if (!isNaN(number) && number > 0 && number <= aseobiTypes.length) {
      return aseobiTypes[number - 1];
    }

    // Try to find by name (case insensitive)
    const searchTerm = input.toLowerCase();
    return (
      aseobiTypes.find(
        (type) =>
          type.name.toLowerCase().includes(searchTerm) ||
          type.id.toLowerCase().includes(searchTerm),
      ) || null
    );
  }

  async sendAseobiProducts(messageSender: string, aseobiType: AseobiType) {
    // Send introduction message
    await this.sendTextMessage(
      messageSender,
      `Here are the products available in our ${aseobiType.name} collection:\n\n`,
    );

    // Send each product
    for (const product of aseobiType.products) {
      const productInfo = `
*${product.name}*
Price: ₦${product.price.toLocaleString()}
Description: ${product.description}
Colors: ${product.colors.join(', ')}
${product.sizes ? `Sizes: ${product.sizes.join(', ')}` : ''}
${product.material ? `Material: ${product.material}` : ''}
${product.careInstructions ? `Care: ${product.careInstructions}` : ''}
      `.trim();

      // Send product image
      await this.sendImageMessage(messageSender, product.imageUrl, productInfo);
    }

    // Send closing message
    await this.sendTextMessage(
      messageSender,
      "To view another Aseobi type, please reply with the number or name of the type you're interested in.",
    );
  }
}
