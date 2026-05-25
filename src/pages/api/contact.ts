import { validateContactForm } from '../../lib/validation/input-validation';
import { verifyTurnstileToken } from '../../lib/server/turnstile';

export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validation = validateContactForm({
      name: body.name,
      email: body.email,
      phone: body.phone,
      subject: body.subject,
      message: body.message,
      consent: body.consent,
      popia_consent: body.popia_consent
    });
    
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: validation.errors 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verify Turnstile token if present
    if (body.cf_turnstile_token) {
      const turnstileValid = await verifyTurnstileToken(body.cf_turnstile_token);
      if (!turnstileValid) {
        return new Response(
          JSON.stringify({ error: 'CAPTCHA verification failed' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Additional security checks
    if (body.website && body.website.trim() !== '') {
      // Honeypot field detected - likely spam
      console.log('Spam detected via honeypot field');
      return new Response(
        JSON.stringify({ ok: true }), // Return success to trick bots
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Sanitize inputs
    const sanitizedData = {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone ? body.phone.trim() : null,
      subject: body.subject.trim(),
      message: body.message.trim(),
      consent: !!body.consent,
      popia_consent: !!body.popia_consent
    };
    
    // Process the contact form (save to database, send email, etc.)
    // This would typically involve saving to a database and sending an email
    console.log('Processing contact form:', sanitizedData);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return new Response(
      JSON.stringify({ ok: true, message: 'Inquiry received successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Contact form submission failed:', error);
    return new Response(
      JSON.stringify({ error: 'Submission failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}