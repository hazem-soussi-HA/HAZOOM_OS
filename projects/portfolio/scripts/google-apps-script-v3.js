// ============================================
// Google Apps Script — Portfolio Contact Form v3
// ============================================

function doPost(e) {
  try {
    Logger.log('doPost called');
    Logger.log('postData: ' + JSON.stringify(e));
    
    var data = {};
    
    // Try to parse JSON from postData
    if (e.postData && e.postData.type === 'application/json') {
      try {
        data = JSON.parse(e.postData.contents);
        Logger.log('Parsed JSON: ' + JSON.stringify(data));
      } catch(parseErr) {
        Logger.log('JSON parse error: ' + parseErr);
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Invalid JSON: ' + parseErr.toString()
        })).setMimeType(ContentService.MimeType.JSON);
      }
    } else if (e.parameter) {
      data = e.parameter;
      Logger.log('Using parameters: ' + JSON.stringify(data));
    } else {
      // Try parsing postData as JSON anyway
      try {
        data = JSON.parse(e.postData.contents);
      } catch(err) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'No data received. postData type: ' + (e.postData ? e.postData.type : 'none')
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    var name = (data.name || '').toString().trim();
    var email = (data.email || '').toString().trim();
    var message = (data.message || '').toString().trim();
    
    Logger.log('Name: ' + name + ', Email: ' + email + ', Message length: ' + message.length);
    
    if (!name || name.length < 2) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Name required (min 2 chars)'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (!email || email.length < 5 || email.indexOf('@') === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Valid email required'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (!message || message.length < 10) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Message required (min 10 chars)'
      })).setMimeType(ContentService.MimeType.JSON);
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
    
    Logger.log('Sending email to hazem.soussi@gmail.com...');
    
    MailApp.sendEmail({
      to: 'hazem.soussi@gmail.com',
      subject: subject,
      body: body,
      replyTo: email,
      name: 'Portfolio Contact'
    });
    
    Logger.log('Email sent successfully!');
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Email sent successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'Portfolio Contact Form API v3 — Active',
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function testEmail() {
  MailApp.sendEmail({
    to: 'hazem.soussi@gmail.com',
    subject: '[Portfolio] Test from GAS v3',
    body: 'If you receive this, your portfolio contact form is working!\n\nSent from: https://hazem-soussi-ha.github.io/portfolio_final/',
    name: 'Portfolio Contact'
  });
  Logger.log('Test email sent!');
}
