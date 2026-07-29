// ============================================
// Google Apps Script — Portfolio Contact Form v4
// Handles both JSON and form-encoded POST data
// ============================================

function doPost(e) {
  try {
    var name = '', email = '', message = '';
    
    // Try to get data from JSON body
    if (e.postData && e.postData.contents) {
      try {
        var jsonData = JSON.parse(e.postData.contents);
        name = jsonData.name || '';
        email = jsonData.email || '';
        message = jsonData.message || '';
      } catch(err) {
        // Not JSON — try form data
      }
    }
    
    // If not from JSON, try form parameters
    if (!name && e.parameter) {
      name = e.parameter.name || '';
      email = e.parameter.email || '';
      message = e.parameter.message || '';
    }
    
    // Trim
    name = name.toString().trim();
    email = email.toString().trim();
    message = message.toString().trim();
    
    // Validation
    if (!name || name.length < 2) {
      return ContentService.createTextOutput('ERROR: Name required').setMimeType(ContentService.MimeType.TEXT);
    }
    if (!email || email.length < 5 || email.indexOf('@') === -1) {
      return ContentService.createTextOutput('ERROR: Valid email required').setMimeType(ContentService.MimeType.TEXT);
    }
    if (!message || message.length < 10) {
      return ContentService.createTextOutput('ERROR: Message required').setMimeType(ContentService.MimeType.TEXT);
    }
    
    // Build and send email
    var subject = '[Portfolio] ' + name + ' <' + email + '>';
    
    var body = '═══════════════════════════════════════\n';
    body += '  PORTFOLIO CONTACT FORM\n';
    body += '═══════════════════════════════════════\n\n';
    body += 'Name: ' + name + '\n';
    body += 'Email: ' + email + '\n';
    body += 'Time: ' + new Date().toISOString() + '\n';
    body += '───────────────────────────────────────\n\n';
    body += message + '\n\n';
    body += '───────────────────────────────────────\n';
    body += 'Reply to: ' + email + '\n';
    body += 'Source: https://hazem-soussi-ha.github.io/portfolio_final/\n';
    
    MailApp.sendEmail({
      to: 'hazem.soussi@gmail.com',
      subject: subject,
      body: body,
      replyTo: email,
      name: 'Portfolio Contact'
    });
    
    // Return success page
    return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
    
  } catch (error) {
    return ContentService.createTextOutput('ERROR: ' + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('Portfolio Contact Form API v4 — Active').setMimeType(ContentService.MimeType.TEXT);
}
