// Base template for all emails
const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FAST-BITES</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f9fafc;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 50px auto;
            background-color: #ffffff;
            border-radius: 20px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            text-align: center;
            padding: 30px;
            background-color: hsl(144, 96%, 9%);
        }
        .header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
        }
        .content {
            text-align: center;
            padding: 40px;
        }
        .content h2 {
            font-family: 'Playfair Display', serif;
            font-size: 26px;
            color: hsl(144, 96%, 9%);
            margin-bottom: 20px;
        }
        .content p {
            font-size: 18px;
            color: hsl(144, 96%, 9%);
            margin-bottom: 25px;
        }
        .content strong {
            color: hsl(145, 96%, 21%);
        }
        .code {
            font-size: 28px;
            font-weight: bold;
            color: hsl(144, 96%, 9%);
            margin: 20px 0;
            padding: 15px;
            border: 2px dashed hsl(145, 96%, 21%);
            border-radius: 10px;
            background-color: #fff5f0;
        }
        .btn {
            display: inline-block;
            padding: 16px 24px;
            background-color: hsl(144, 96%, 9%);
            border-radius: 20px;
            color: white;
            text-decoration: none;
            font-weight: bold;
            margin: 20px 0;
        }
        .btn:hover {
            background-color: hsl(145, 96%, 21%);
        }
        .quote {
            font-style: italic;
            color: hsl(144, 96%, 9%);
            text-align: center;
            border-left: 4px solid hsl(145, 96%, 21%);
            padding-left: 15px;
            margin: 30px 0;
            font-family: 'Playfair Display', serif;
        }
        .footer {
            text-align: center;
            padding: 20px;
            background-color: #f1f1f1;
            color: #888888;
        }
        .footer p {
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>FAST-BITES</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; 2024 Fast-Bites. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

// Email verification template
export const generateVerificationEmailHtml = (verificationToken: string) => {
  const content = `
    <h2>Verify Your Email!</h2>
    <p>We're excited to have you on board. To complete your registration, please enter the 6-digit verification code below:</p>
    <div class="code">${verificationToken}</div>
    <p>This code will expire in 24 hours.</p>
    <p>If you didn't create an account with Fast-Bites, please ignore this email.</p>
    <div class="quote">
        "Good food is all the sweeter when shared with good friends."<br><strong>– Fast-Bites Team</strong>
    </div>
    <p>
        If you have any questions or need assistance, our customer support team is always here for you. 
        Feel free to <a href="mailto:support@fast-bites.com" style="color: hsl(145, 96%, 21%); text-decoration: none;">reach out</a> at any time.
    </p>
  `;
  
  return baseTemplate(content);
};

// Welcome email template
export const generateWelcomeEmailHtml = (name: string) => {
  const content = `
    <h2>Welcome to FAST-BITES, ${name}!</h2>
    <p>Your email has been successfully verified and your account is now active.</p>
    <p>You can now enjoy all the features of our platform, including ordering delicious food, tracking deliveries, and much more!</p>
    <a href="${process.env.FRONTEND_URL}" class="btn">Start Ordering</a>
    <div class="quote">
        "People who love to eat are always the best people."<br><strong>– Fast-Bites Team</strong>
    </div>
  `;
  
  return baseTemplate(content);
};

// Password reset email template
export const generatePasswordResetEmailHtml = (resetURL: string) => {
  const content = `
    <h2>Reset Your Password</h2>
    <p>We received a request to reset your password. Click the button below to set a new password:</p>
    <a href="${resetURL}" class="btn">Reset Password</a>
    <p>If you didn't request this, you can safely ignore this email - your account is still secure.</p>
    <p>This reset link is valid for 1 hour.</p>
  `;
  
  return baseTemplate(content);
};

// Password reset success email template
export const generateResetSuccessEmailHtml = () => {
  const content = `
    <h2>Password Reset Successfully</h2>
    <p>Your password has been reset successfully.</p>
    <p>You can now log in to your account with your new password.</p>
    <a href="${process.env.FRONTEND_URL}/login" class="btn">Go to Login</a>
    <p>If you did not reset your password, please contact our support team immediately.</p>
  `;
  
  return baseTemplate(content);
}; 