// ============================================
// Google Apps Script — Portfolio Contact Form v2
// 
// SETUP:
// 1. Go to https://script.google.com
// 2. Create new project
// 3. Replace code with this
// 4. Deploy → New deployment → Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 5. Copy the Web App URL
// 6. Replace GAS_WEB_APP_URL in ContactSection.jsx
// ============================================

function doPost(e) {
  try {
    var data;
    
    // Handle both JSON and form data
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch(err) {
        // Try parsing as form data
        data = {};
        var params = e.postData.contents.split('&');
        for (var i = 0; i < params.length; i++) {
          var pair = params[i].split('=');
          if (pair.length === 2) {
            data[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1].replace(/\+/g, ' '));
          }
        }
      }
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'No data received'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var name = (data.name || 'Unknown').toString().trim();
    var email = (data.email || '').toString().trim();
    var message = (data.message || '').toString().trim();
    var lang = (data._language || 'en').toString();
    
    // Validation
    if (name.length < 2) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Name too short'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (email.length < 5 || email.indexOf('@') === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid email'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (message.length < 10) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Message too short'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Build email
    var subject = '[Portfolio] ' + name + ' <' + email + '>';
    
    var body = '═══════════════════════════════════════\n';
    body += '  PORTFOLIO CONTACT FORM\n';
    body += '═══════════════════════════════════════\n\n';
    body += 'Name: ' + name + '\n';
    body += 'Email: ' + email + '\n';
    body += 'Language: ' + lang + '\n';
    body += 'Time: ' + new Date().toISOString() + '\n';
    if (data._timeOnPage) body += 'Time on page: ' + data._timeOnPage + 's\n';
    body += '───────────────────────────────────────\n\n';
    body += message + '\n\n';
    body += '───────────────────────────────────────\n';
    body += 'Reply directly to: ' + email + '\n';
    body += 'Source: https://hazem-soussi-ha.github.io/portfolio_final/\n';
    
    // Send email
    MailApp.sendEmail({
      to: 'hazem.soussi@gmail.com',
      subject: subject,
      body: body,
      replyTo: email,
      name: 'Portfolio Contact'
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Email sent successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Test endpoint — visit in browser
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'Portfolio Contact Form API v2 — Active',
    time: new Date().toISOString(),
    usage: 'POST JSON with name, email, message fields'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Test email — run once to authorize
function testEmail() {
  MailApp.sendEmail({
    to: 'hazem.soussi@gmail.com',
    subject: '[Portfolio] Test from GAS',
    body: 'If you receive this, your portfolio contact form is working!\n\nSent from: https://hazem-soussi-ha.github.io/portfolio_final/',
    name: 'Portfolio Contact'
  });
  Logger.log('Test email sent!');
}
