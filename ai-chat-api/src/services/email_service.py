"""
Email Service for sending verification codes and notifications

Supports multiple email providers:
- Console (development) - logs emails to console
- SendGrid - popular email service with free tier
- AWS SES - Amazon Simple Email Service
- SMTP - generic SMTP server support
"""

import os
import logging
import random
from typing import Optional

logger = logging.getLogger(__name__)

# Email provider configuration
EMAIL_PROVIDER = os.getenv('EMAIL_PROVIDER', 'console')  # console, sendgrid, aws_ses, smtp

# SendGrid configuration
SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY', '')
SENDGRID_FROM_EMAIL = os.getenv('SENDGRID_FROM_EMAIL', 'noreply@zeneme.com')

# AWS SES configuration
AWS_SES_REGION = os.getenv('AWS_SES_REGION', 'us-east-1')
AWS_SES_FROM_EMAIL = os.getenv('AWS_SES_FROM_EMAIL', 'noreply@zeneme.com')

# SMTP configuration
SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
SMTP_FROM_EMAIL = os.getenv('SMTP_FROM_EMAIL', 'noreply@zeneme.com')


def generate_verification_code() -> str:
    """Generate a 6-digit verification code"""
    return str(random.randint(100000, 999999))


def send_verification_email_console(to_email: str, code: str) -> bool:
    """
    Console mode - logs email to console (for development)
    """
    logger.info(f"[EMAIL] 📧 VERIFICATION CODE for {to_email}: {code}")
    logger.info(f"[EMAIL] Subject: Verify your Zeneme account")
    logger.info(f"[EMAIL] Body: Your verification code is: {code}")
    logger.info(f"[EMAIL] This code will expire in 10 minutes.")
    return True


def send_verification_email_sendgrid(to_email: str, code: str) -> bool:
    """
    SendGrid provider - sends email via SendGrid API

    Setup:
    1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
    2. Create API key in Settings > API Keys
    3. Set environment variables:
       EMAIL_PROVIDER=sendgrid
       SENDGRID_API_KEY=your_api_key
       SENDGRID_FROM_EMAIL=noreply@yourdomain.com
    4. Install: pip install sendgrid
    """
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail

        message = Mail(
            from_email=SENDGRID_FROM_EMAIL,
            to_emails=to_email,
            subject='Verify your Zeneme account',
            html_content=f'''
            <html>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Welcome to Zeneme!</h2>
                    <p>Your verification code is:</p>
                    <h1 style="color: #4F46E5; letter-spacing: 5px;">{code}</h1>
                    <p>This code will expire in 10 minutes.</p>
                    <p>If you didn't request this code, please ignore this email.</p>
                </body>
            </html>
            '''
        )

        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)

        logger.info(f"[EMAIL] SendGrid email sent to {to_email}, status: {response.status_code}")
        return response.status_code == 202

    except Exception as e:
        logger.error(f"[EMAIL] SendGrid error: {e}")
        return False


def send_verification_email_aws_ses(to_email: str, code: str) -> bool:
    """
    AWS SES provider - sends email via Amazon Simple Email Service

    Setup:
    1. Verify email address in AWS SES console
    2. Configure AWS credentials (AWS CLI or environment variables)
    3. Set environment variables:
       EMAIL_PROVIDER=aws_ses
       AWS_SES_REGION=us-east-1
       AWS_SES_FROM_EMAIL=noreply@yourdomain.com
    4. Install: pip install boto3
    """
    try:
        import boto3

        client = boto3.client('ses', region_name=AWS_SES_REGION)

        response = client.send_email(
            Source=AWS_SES_FROM_EMAIL,
            Destination={'ToAddresses': [to_email]},
            Message={
                'Subject': {'Data': 'Verify your Zeneme account'},
                'Body': {
                    'Html': {
                        'Data': f'''
                        <html>
                            <body style="font-family: Arial, sans-serif; padding: 20px;">
                                <h2>Welcome to Zeneme!</h2>
                                <p>Your verification code is:</p>
                                <h1 style="color: #4F46E5; letter-spacing: 5px;">{code}</h1>
                                <p>This code will expire in 10 minutes.</p>
                                <p>If you didn't request this code, please ignore this email.</p>
                            </body>
                        </html>
                        '''
                    }
                }
            }
        )

        logger.info(f"[EMAIL] AWS SES email sent to {to_email}, MessageId: {response['MessageId']}")
        return True

    except Exception as e:
        logger.error(f"[EMAIL] AWS SES error: {e}")
        return False


def send_verification_email_smtp(to_email: str, code: str) -> bool:
    """
    SMTP provider - sends email via generic SMTP server

    Setup:
    1. Get SMTP credentials from your email provider
    2. Set environment variables:
       EMAIL_PROVIDER=smtp
       SMTP_HOST=smtp.gmail.com
       SMTP_PORT=587
       SMTP_USERNAME=your_email@gmail.com
       SMTP_PASSWORD=your_app_password
       SMTP_FROM_EMAIL=your_email@gmail.com

    For Gmail:
    - Enable 2FA in Google Account
    - Generate App Password: https://myaccount.google.com/apppasswords
    """
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        message = MIMEMultipart('alternative')
        message['Subject'] = 'Verify your Zeneme account'
        message['From'] = SMTP_FROM_EMAIL
        message['To'] = to_email

        html = f'''
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Welcome to Zeneme!</h2>
                <p>Your verification code is:</p>
                <h1 style="color: #4F46E5; letter-spacing: 5px;">{code}</h1>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
            </body>
        </html>
        '''

        part = MIMEText(html, 'html')
        message.attach(part)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(message)

        logger.info(f"[EMAIL] SMTP email sent to {to_email}")
        return True

    except Exception as e:
        logger.error(f"[EMAIL] SMTP error: {e}")
        return False


def send_verification_email(to_email: str, code: str) -> bool:
    """
    Send verification email using configured provider

    Args:
        to_email: Recipient email address
        code: 6-digit verification code

    Returns:
        bool: True if email sent successfully
    """
    logger.info(f"[EMAIL] Sending verification code to {to_email} via {EMAIL_PROVIDER}")

    if EMAIL_PROVIDER == 'console':
        return send_verification_email_console(to_email, code)
    elif EMAIL_PROVIDER == 'sendgrid':
        return send_verification_email_sendgrid(to_email, code)
    elif EMAIL_PROVIDER == 'aws_ses':
        return send_verification_email_aws_ses(to_email, code)
    elif EMAIL_PROVIDER == 'smtp':
        return send_verification_email_smtp(to_email, code)
    else:
        logger.error(f"[EMAIL] Unknown email provider: {EMAIL_PROVIDER}")
        return False
