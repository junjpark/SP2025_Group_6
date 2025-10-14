"""
Email service for sending password reset emails.
Handles email configuration and template rendering.
"""

import os
from dotenv import load_dotenv
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from fastapi_mail.errors import ConnectionErrors
from jinja2 import Template, TemplateError

# Load .env file from the backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Email configuration
MAIL_USERNAME = "coryapp.team@gmail.com"
MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "")  # App password for Gmail
MAIL_FROM = "coryapp.team@gmail.com"
MAIL_PORT = 587
MAIL_SERVER = "smtp.gmail.com"

# Email connection configuration
conf = ConnectionConfig(
    MAIL_USERNAME=MAIL_USERNAME,
    MAIL_PASSWORD=MAIL_PASSWORD,
    MAIL_FROM=MAIL_FROM,
    MAIL_PORT=MAIL_PORT,
    MAIL_SERVER=MAIL_SERVER,
    USE_CREDENTIALS=True,
    MAIL_SSL_TLS=False,  # Use STARTTLS instead of SSL/TLS
    MAIL_STARTTLS=True,  # Use STARTTLS for Gmail (port 587)
    MAIL_DEBUG=0
)

# Email templates
PASSWORD_RESET_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset - Cory</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #ffffff !important;
            background-color: #1a1d29;
            margin: 0;
            padding: 0;
        }
        * {
            color: #ffffff !important;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #1a1d29;
            padding: 40px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #4a5568;
        }
        .header h1 {
            color: #ffffff;
            font-size: 32px;
            margin: 0;
            font-weight: bold;
        }
        .content {
            padding: 20px 0;
            text-align: left;
            color: #ffffff;
        }
        .content h2 {
            color: #ffffff;
            font-size: 20px;
            margin-top: 0;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            padding: 12px 25px;
            background-color: #3b82f6;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            transition: all 0.3s;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .button:hover {
            background-color: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #4a5568;
            color: #ffffff;
            font-size: 12px;
        }
        .footer p {
            margin: 5px 0;
        }
        .link-text {
            color: #ffffff;
            text-decoration: none;
        }
        .link-text:hover {
            text-decoration: underline;
        }
        .expiry-notice {
            background-color: #2d3748;
            color: #ffffff;
            padding: 10px 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
            text-align: center;
        }
        .url-fallback {
            background-color: #2d3748;
            color: #ffffff;
            padding: 10px 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 12px;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🔒 Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Hello {{ user_name }}!</h2>
            <p>We received a request to reset your password for your Cory account.</p>
            <p>Click the button below to reset your password:</p>
            <div class="button-container">
                <a href="{{ reset_url }}" class="button">Reset Password</a>
            </div>
            <div class="expiry-notice">
                <strong>This link will expire in 1 hour.</strong>
            </div>
            <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <div class="url-fallback">{{ reset_url }}</div>
        </div>
        <div class="footer">
            <p>If you have any questions, please contact us at <a href="mailto:coryapp.team@gmail.com" class="link-text">coryapp.team@gmail.com</a></p>
        </div>
    </div>
</body>
</html>
"""

PASSWORD_RESET_SUCCESS_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset Successful - Cory</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #ffffff !important;
            background-color: #1a1d29;
            margin: 0;
            padding: 0;
        }
        p {
            color: #ffffff !important;
            margin: 10px 0;
        }
        * {
            color: #ffffff !important;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #1a1d29;
            padding: 40px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #4a5568;
        }
        .header h1 {
            color: #ffffff;
            font-size: 32px;
            margin: 0;
            font-weight: bold;
        }
        .content {
            padding: 20px 0;
            text-align: left;
            color: #ffffff;
        }
        .content h2 {
            color: #ffffff;
            font-size: 20px;
            margin-top: 0;
        }
        .success-notice {
            background-color: #166534;
            color: #ffffff;
            padding: 10px 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
            text-align: center;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #4a5568;
            color: #ffffff;
            font-size: 12px;
        }
        .footer p {
            margin: 5px 0;
        }
        .link-text {
            color: #ffffff;
            text-decoration: none;
        }
        .link-text:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>✅ Password Reset Successful</h1>
        </div>
        <div class="content">
            <h2>Hello {{ user_name }}!</h2>
            <div class="success-notice">
                <strong>Your password has been successfully reset!</strong>
            </div>
            <p>You can now log in to your Cory account with your new password.</p>
            <p>If you didn't make this change, please contact us immediately at <a href="mailto:coryapp.team@gmail.com" class="link-text">coryapp.team@gmail.com</a></p>
        </div>
        <div class="footer">
            <p>If you have any questions, please contact us at <a href="mailto:coryapp.team@gmail.com" class="link-text">coryapp.team@gmail.com</a></p>
        </div>
    </div>
</body>
</html>
"""



async def send_password_reset_email(
    email: str,
    user_name: str,
    reset_token: str,
    frontend_url: str = "http://localhost:5173"
) -> bool:
    """
    Send a password reset email with a reset link to the user.
    """
    try:
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"
        template = Template(PASSWORD_RESET_TEMPLATE)
        html_content = template.render(user_name=user_name, reset_url=reset_url)

        message = MessageSchema(
            subject="Password Reset Request - Cory",
            recipients=[email],
            body=html_content,
            subtype="html"
        )

        fast_mail = FastMail(conf)
        await fast_mail.send_message(message)

        print(f"Password reset email sent to {email}")
        return True

    except (ConnectionErrors, TemplateError) as error:
        print(f"Error sending password reset email: {error}")
        return False


async def send_password_reset_success_email(email: str, user_name: str) -> bool:
    """
    Send password reset success confirmation email.

    Args:
        email: User's email address
        user_name: User's display name

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Render email template
        template = Template(PASSWORD_RESET_SUCCESS_TEMPLATE)
        html_content = template.render(user_name=user_name)

        # Create message
        message = MessageSchema(
            subject="Password Reset Successful - Cory",
            recipients=[email],
            body=html_content,
            subtype="html"
        )

        # Send email
        fast_mail = FastMail(conf)
        await fast_mail.send_message(message)

        print(f"Password reset success email sent to {email}")
        return True

    except (ConnectionErrors, TemplateError) as error:
        print(f"Error sending password reset success email: {error}")
        return False
