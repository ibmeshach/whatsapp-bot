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

  async sendInteractiveButtons(
    messageSender: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
    headerText?: string,
    footerText?: string,
  ) {
    const url = `https://graph.facebook.com/${process.env.WHATSAPP_CLOUD_API_VERSION}/${process.env.WHATSAPP_CLOUD_API_PHONE_NUMBER_ID}/messages`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_API_ACCESS_TOKEN}`,
      },
    };

    const interactiveMessage: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: messageSender,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: bodyText,
        },
        action: {
          buttons: buttons.map((button) => ({
            type: 'reply',
            reply: {
              id: button.id,
              title: button.title,
            },
          })),
        },
      },
    };

    if (headerText) {
      interactiveMessage.interactive.header = {
        type: 'text',
        text: headerText,
      };
    }

    if (footerText) {
      interactiveMessage.interactive.footer = {
        text: footerText,
      };
    }

    const data = JSON.stringify(interactiveMessage);
    return this.sendMessage(url, config, data);
  }

  async sendInteractiveList(
    messageSender: string,
    bodyText: string,
    buttonText: string,
    sections: Array<{
      title?: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>,
    headerText?: string,
    footerText?: string,
  ) {
    const url = `https://graph.facebook.com/${process.env.WHATSAPP_CLOUD_API_VERSION}/${process.env.WHATSAPP_CLOUD_API_PHONE_NUMBER_ID}/messages`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_API_ACCESS_TOKEN}`,
      },
    };

    const interactiveMessage: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: messageSender,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: {
          text: bodyText,
        },
        action: {
          button: buttonText,
          sections: sections,
        },
      },
    };

    if (headerText) {
      interactiveMessage.interactive.header = {
        type: 'text',
        text: headerText,
      };
    }

    if (footerText) {
      interactiveMessage.interactive.footer = {
        text: footerText,
      };
    }

    const data = JSON.stringify(interactiveMessage);
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

  async sendWelcomeMessage(messageSender: string) {
    const welcomeText = `Welcome to MyAseobi! 👋

We are Nigeria's premier destination for beautiful traditional wear (Aseobi) with modern touches. 

Our collection features:
✨ High-quality fabrics
🎨 Contemporary designs  
👗 Traditional and modern styles
🚚 Fast delivery nationwide
💯 100% satisfaction guarantee

To browse our products, simply type "shop" and we'll show you our amazing collection!

Thank you for choosing MyAseobi - where tradition meets style! 🌟`;

    return this.sendTextMessage(messageSender, welcomeText);
  }

  async sendCatalogOptions(messageSender: string) {
    const sections = [
      {
        title: 'Aseobi Categories',
        rows: aseobiTypes.map((type) => ({
          id: `category_${type.id}`,
          title: type.name,
          description: type.description,
        })),
      },
    ];

    return this.sendInteractiveList(
      messageSender,
      "Please choose the Aseobi category you're interested in:",
      'Options',
      sections,
      'Our Aseobi Collection',
      'Tap to select an item',
    );
  }

  async sendCategoryCatalogCard(messageSender: string, categoryId: string) {
    const category = this.findAseobiTypeById(categoryId);
    if (!category) {
      await this.sendTextMessage(messageSender, 'Sorry, category not found.');
      return;
    }

    const totalProducts = category.products.length;
    const firstProduct = category.products[0];

    // Send the catalog card with product image and "View items" button
    const url = `https://graph.facebook.com/${process.env.WHATSAPP_CLOUD_API_VERSION}/${process.env.WHATSAPP_CLOUD_API_PHONE_NUMBER_ID}/messages`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_API_ACCESS_TOKEN}`,
      },
    };

    const interactiveMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: messageSender,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: {
          type: 'image',
          image: {
            link: firstProduct.imageUrl,
          },
        },
        body: {
          text: `Checkout our ${category.name} here.`,
        },
        footer: {
          text: `${category.name}\n${totalProducts} items`,
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: `view_${category.id}`,
                title: 'View items',
              },
            },
          ],
        },
      },
    };

    const data = JSON.stringify(interactiveMessage);
    return this.sendMessage(url, config, data);
  }

  async sendCategoryProducts(messageSender: string, categoryId: string) {
    const category = this.findAseobiTypeById(categoryId);
    if (!category) {
      await this.sendTextMessage(messageSender, 'Sorry, category not found.');
      return;
    }

    // Send header message
    await this.sendTextMessage(
      messageSender,
      `📱 ${category.name}\n${category.products.length} items\n\n${category.description}`,
    );

    // Send each product as a separate message with image and details
    for (const product of category.products) {
      const productDetails = `*${product.name}*
💰 Price: ₦${product.price.toLocaleString()}
📝 ${product.description}
🎨 Colors: ${product.colors.join(', ')}
${product.sizes ? `📏 Sizes: ${product.sizes.join(', ')}` : ''}
${product.material ? `🧵 Material: ${product.material}` : ''}
${product.careInstructions ? `🧼 Care: ${product.careInstructions}` : ''}`;

      await this.sendImageMessage(
        messageSender,
        product.imageUrl,
        productDetails,
      );
    }

    // Send navigation buttons
    await this.sendInteractiveButtons(
      messageSender,
      'Choose an option:',
      [
        { id: 'back_to_categories', title: '⬅️ Back to Categories' },
        { id: 'continue_shopping', title: '🛍️ Continue Shopping' },
      ],
      undefined,
      'What would you like to do next?',
    );
  }

  findAseobiTypeById(id: string): AseobiType | null {
    return aseobiTypes.find((type) => type.id === id) || null;
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
      'To view another category, type "shop" again. Thank you for shopping with MyAseobi! 🛍️',
    );
  }
}
