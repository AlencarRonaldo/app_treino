interface WhatsAppConfig {
  apiKey: string;
  phoneNumberId: string;
  accessToken: string;
  version: string;
}

interface WhatsAppMessage {
  messaging_product: string;
  to: string;
  type: string;
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
}

class WhatsAppService {
  private config: WhatsAppConfig;
  private baseUrl: string;

  constructor() {
    // Configuração do WhatsApp Business API
    // Você pode usar: Twilio, 360dialog, MessageBird, etc.
    this.config = {
      apiKey: process.env.WHATSAPP_API_KEY || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      version: 'v18.0'
    };

    this.baseUrl = `https://graph.facebook.com/${this.config.version}/${this.config.phoneNumberId}`;
  }

  /**
   * Envia uma mensagem de texto simples via WhatsApp
   */
  async sendTextMessage(phoneNumber: string, message: string): Promise<any> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      const messageData: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('WhatsApp message sent:', result);
      
      return result;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Envia uma mensagem usando template do WhatsApp Business
   */
  async sendTemplateMessage(phoneNumber: string, templateName: string, languageCode: string = 'pt_BR', components?: any[]): Promise<any> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      const messageData: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          ...(components && { components })
        }
      };

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('WhatsApp template message sent:', result);
      
      return result;
    } catch (error) {
      console.error('Error sending WhatsApp template message:', error);
      throw error;
    }
  }

  /**
   * Envia credenciais de login para um novo aluno
   */
  async sendLoginCredentials(name: string, email: string, password: string, phoneNumber: string): Promise<any> {
    const message = this.generateLoginMessage(name, email, password);
    return this.sendTextMessage(phoneNumber, message);
  }

  /**
   * Gera mensagem de login personalizada
   */
  private generateLoginMessage(name: string, email: string, password: string): string {
    return `Olá ${name}! 

Seu acesso ao sistema da academia foi criado com sucesso!

📱 **Credenciais de Login:**
• Email: ${email}
• Senha: ${password}

🔗 **Link de acesso:** ${process.env.NEXT_PUBLIC_APP_URL || 'https://suaacademia.com'}/login

⚠️ **Importante:** 
- Altere sua senha no primeiro acesso
- Mantenha suas credenciais seguras
- Em caso de dúvidas, entre em contato conosco

Bem-vindo(a) à nossa academia! 💪`;
  }

  /**
   * Formata número de telefone para o formato internacional
   */
  private formatPhoneNumber(phone: string): string {
    // Remove todos os caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');
    
    // Se começa com 0, remove
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Se não tem código do país, adiciona 55 (Brasil)
    if (cleaned.length === 11) {
      cleaned = '55' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Verifica se o serviço está configurado corretamente
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.phoneNumberId && this.config.accessToken);
  }

  /**
   * Testa a conexão com a API do WhatsApp
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error('WhatsApp connection test failed:', error);
      return false;
    }
  }
}

// Exporta uma instância singleton
export const whatsAppService = new WhatsAppService();

// Função helper para envio rápido
export async function sendWhatsAppMessage(phone: string, message: string) {
  if (!whatsAppService.isConfigured()) {
    console.warn('WhatsApp service not configured, using mock');
    // Mock para desenvolvimento
    console.log(`[MOCK] Enviando WhatsApp para ${phone}: ${message}`);
    return { success: true, messageId: `mock_${Date.now()}` };
  }

  return whatsAppService.sendTextMessage(phone, message);
}

// Função helper para envio de credenciais
export async function sendLoginCredentials(name: string, email: string, password: string, phone: string) {
  return whatsAppService.sendLoginCredentials(name, email, password, phone);
} 