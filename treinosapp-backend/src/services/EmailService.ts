/**
 * Email Service
 * Serviço para envio de emails
 */

import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { EmailTemplate } from '../types';

export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465, // true para 465, false para outras portas
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false // Para desenvolvimento
      }
    });

    // Verificar conexão SMTP (apenas se configurado)
    if (config.SMTP_USER && config.SMTP_PASS) {
      this.verifyConnection();
    }
  }

  /**
   * Verificar conexão SMTP
   */
  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('✅ Conexão SMTP verificada com sucesso');
    } catch (error) {
      logger.error('❌ Erro na conexão SMTP:', error);
    }
  }

  /**
   * Enviar email genérico
   */
  async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      if (!config.SMTP_USER || !config.SMTP_PASS) {
        logger.warn('📧 SMTP não configurado - simulando envio de email:', {
          to: template.to,
          subject: template.subject
        });
        return true;
      }

      const mailOptions = {
        from: `${config.FROM_NAME} <${config.FROM_EMAIL}>`,
        to: template.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        attachments: template.attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('✅ Email enviado com sucesso:', {
        to: template.to,
        subject: template.subject,
        messageId: info.messageId
      });

      return true;
    } catch (error: any) {
      logger.error('❌ Erro ao enviar email:', {
        to: template.to,
        subject: template.subject,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Enviar email de verificação
   */
  async sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
    const verificationUrl = `${config.CORS_ORIGIN.split(',')[0]}/verify-email/${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verificar Email - TreinosApp</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .button:hover { opacity: 0.9; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏋️‍♂️ TreinosApp</h1>
            <h2>Bem-vindo(a), ${name}!</h2>
          </div>
          <div class="content">
            <h3>Verificar seu Email</h3>
            <p>Obrigado por se cadastrar no TreinosApp! Para começar a usar nossa plataforma, você precisa verificar seu endereço de email.</p>
            <p>Clique no botão abaixo para verificar sua conta:</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verificar Email</a>
            </p>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${verificationUrl}
            </p>
            <p><strong>Este link expira em 24 horas.</strong></p>
            <p>Se você não se cadastrou no TreinosApp, pode ignorar este email com segurança.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p>Precisa de ajuda? Entre em contato conosco em ${config.FROM_EMAIL}</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 TreinosApp. Todos os direitos reservados.</p>
            <p>Aplicativo de fitness brasileiro para todos os níveis.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Bem-vindo(a) ao TreinosApp, ${name}!
      
      Para verificar sua conta, acesse: ${verificationUrl}
      
      Este link expira em 24 horas.
      
      Se você não se cadastrou no TreinosApp, pode ignorar este email.
      
      TreinosApp - Seu aplicativo de fitness brasileiro
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verificar seu email - TreinosApp',
      html,
      text
    });
  }

  /**
   * Enviar email de redefinição de senha
   */
  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<boolean> {
    const resetUrl = `${config.CORS_ORIGIN.split(',')[0]}/reset-password/${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redefinir Senha - TreinosApp</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .button:hover { opacity: 0.9; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏋️‍♂️ TreinosApp</h1>
            <h2>Redefinição de Senha</h2>
          </div>
          <div class="content">
            <h3>Olá, ${name}!</h3>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no TreinosApp.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Redefinir Senha</a>
            </p>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${resetUrl}
            </p>
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este link expira em 1 hora por segurança</li>
                <li>Se você não solicitou esta redefinição, ignore este email</li>
                <li>Sua senha atual continuará funcionando normalmente</li>
              </ul>
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p>Precisa de ajuda? Entre em contato conosco em ${config.FROM_EMAIL}</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 TreinosApp. Todos os direitos reservados.</p>
            <p>Aplicativo de fitness brasileiro para todos os níveis.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Redefinição de Senha - TreinosApp
      
      Olá, ${name}!
      
      Para redefinir sua senha, acesse: ${resetUrl}
      
      Este link expira em 1 hora.
      
      Se você não solicitou esta redefinição, ignore este email.
      
      TreinosApp - Seu aplicativo de fitness brasileiro
    `;

    return this.sendEmail({
      to: email,
      subject: 'Redefinir sua senha - TreinosApp',
      html,
      text
    });
  }

  /**
   * Enviar email de boas-vindas
   */
  async sendWelcomeEmail(email: string, name: string, userType: string): Promise<boolean> {
    const dashboardUrl = `${config.CORS_ORIGIN.split(',')[0]}/dashboard`;
    const isPersonalTrainer = userType === 'PERSONAL_TRAINER';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo(a) - TreinosApp</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .feature { background-color: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏋️‍♂️ TreinosApp</h1>
            <h2>Bem-vindo(a), ${name}!</h2>
          </div>
          <div class="content">
            <p>Parabéns! Sua conta foi verificada com sucesso e você já pode começar a usar o TreinosApp.</p>
            
            <h3>🚀 Primeiros Passos:</h3>
            ${isPersonalTrainer ? `
              <div class="feature">
                <h4>👨‍🏫 Para Personal Trainers</h4>
                <ul>
                  <li>Complete seu perfil profissional</li>
                  <li>Crie seus primeiros treinos templates</li>
                  <li>Convide seus alunos para a plataforma</li>
                  <li>Monitore o progresso de cada aluno</li>
                </ul>
              </div>
            ` : `
              <div class="feature">
                <h4>🎯 Para Estudantes</h4>
                <ul>
                  <li>Complete seu perfil e defina seus objetivos</li>
                  <li>Explore nossa biblioteca de exercícios</li>
                  <li>Crie seu primeiro treino personalizado</li>
                  <li>Comece a registrar seu progresso</li>
                </ul>
              </div>
            `}
            
            <h3>✨ Recursos Disponíveis:</h3>
            <div class="feature">
              <strong>📚 Biblioteca de Exercícios</strong><br>
              Centenas de exercícios com instruções detalhadas e vídeos
            </div>
            <div class="feature">
              <strong>💪 Criador de Treinos</strong><br>
              Monte treinos personalizados ou use nossos templates
            </div>
            <div class="feature">
              <strong>📊 Acompanhamento de Progresso</strong><br>
              Gráficos e estatísticas para monitorar sua evolução
            </div>
            <div class="feature">
              <strong>🤖 IA Fitness Assistant</strong><br>
              Geração inteligente de treinos baseada em seus objetivos
            </div>
            
            <p style="text-align: center;">
              <a href="${dashboardUrl}" class="button">Acessar Dashboard</a>
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p>Precisa de ajuda para começar? Confira nossos tutoriais ou entre em contato em ${config.FROM_EMAIL}</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 TreinosApp. Todos os direitos reservados.</p>
            <p>Aplicativo de fitness brasileiro para todos os níveis.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Bem-vindo(a) ao TreinosApp, ${name}!
      
      Sua conta foi verificada com sucesso!
      
      Acesse seu dashboard: ${dashboardUrl}
      
      Recursos disponíveis:
      - Biblioteca de exercícios
      - Criador de treinos
      - Acompanhamento de progresso
      - IA Fitness Assistant
      
      TreinosApp - Seu aplicativo de fitness brasileiro
    `;

    return this.sendEmail({
      to: email,
      subject: 'Bem-vindo(a) ao TreinosApp! 🏋️‍♂️',
      html,
      text
    });
  }

  /**
   * Enviar email de convite para aluno
   */
  async sendStudentInviteEmail(
    studentEmail: string, 
    studentName: string, 
    trainerName: string, 
    inviteToken: string,
    personalMessage?: string
  ): Promise<boolean> {
    const inviteUrl = `${config.CORS_ORIGIN.split(',')[0]}/accept-invite/${inviteToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Convite - TreinosApp</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .message { background-color: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏋️‍♂️ TreinosApp</h1>
            <h2>Você foi convidado(a)!</h2>
          </div>
          <div class="content">
            <h3>Olá, ${studentName}!</h3>
            <p><strong>${trainerName}</strong> convidou você para fazer parte do TreinosApp como seu(sua) aluno(a).</p>
            
            ${personalMessage ? `
              <div class="message">
                <h4>💬 Mensagem do seu Personal Trainer:</h4>
                <p><em>"${personalMessage}"</em></p>
              </div>
            ` : ''}
            
            <p>Com o TreinosApp, você terá acesso a:</p>
            <ul>
              <li>🎯 Treinos personalizados criados pelo seu personal trainer</li>
              <li>📊 Acompanhamento detalhado do seu progresso</li>
              <li>📚 Biblioteca completa de exercícios</li>
              <li>⏱️ Timer integrado para seus treinos</li>
              <li>🤖 Sugestões inteligentes de treinos com IA</li>
            </ul>
            
            <p style="text-align: center;">
              <a href="${inviteUrl}" class="button">Aceitar Convite</a>
            </p>
            
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${inviteUrl}
            </p>
            
            <p><strong>Este convite expira em 7 dias.</strong></p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p>Dúvidas? Entre em contato conosco em ${config.FROM_EMAIL}</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 TreinosApp. Todos os direitos reservados.</p>
            <p>Aplicativo de fitness brasileiro para todos os níveis.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Convite - TreinosApp
      
      Olá, ${studentName}!
      
      ${trainerName} convidou você para o TreinosApp.
      
      ${personalMessage ? `Mensagem: "${personalMessage}"` : ''}
      
      Para aceitar o convite: ${inviteUrl}
      
      Este convite expira em 7 dias.
      
      TreinosApp - Seu aplicativo de fitness brasileiro
    `;

    return this.sendEmail({
      to: studentEmail,
      subject: `${trainerName} te convidou para o TreinosApp 💪`,
      html,
      text
    });
  }
}