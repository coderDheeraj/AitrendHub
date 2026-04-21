---
layout: default
title: "Contact Us"
description: "Get in touch with the Trend-AI editorial team for inquiries, feedback, or collaborations."
permalink: /contact/
---

<div class="" style="max-width: 800px; margin: 0 auto; padding-top: 20px;">
    
    <div class="post-header" style="text-align: center; margin-bottom: 40px;">
        <h1 class="post-title-main" style="margin-top: 20px; font-size: 3rem;">Contact Trend-AI</h1>
        <p style="color: var(--text-secondary); font-size: 1.15rem; max-width: 600px; margin: 0 auto;">We value our community’s feedback and are always open to new insights. Whether you have a question about our content, a press inquiry, or a potential collaboration, we’d love to hear from you.</p>
    </div>

    <div class="contact-layout" style="display: grid; grid-template-columns: 1fr; gap: 40px;">
        
        <div>
            <form action="https://formsubmit.co/contact@trend-ai.dev" method="POST" class="contact-form">
                <!-- Honeypot -->
                <input type="text" name="_honey" style="display:none">
                <!-- Success Configuration -->
                <input type="hidden" name="_next" value="https://trend-ai.dev/contact/">
                <input type="hidden" name="_subject" value="New Submission from Trend-AI Contact Form!">
                <input type="hidden" name="_template" value="box">
                <!-- Disable Captcha (Optional, remove if you want captcha) -->
                <!-- <input type="hidden" name="_captcha" value="false"> -->
                
                <div class="form-group">
                    <label for="name">Name</label>
                    <input type="text" name="name" id="name" required placeholder="Your Name">
                </div>
                
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" name="email" id="email" required placeholder="your.email@example.com">
                </div>
                
                <div class="form-group">
                    <label for="message">Message</label>
                    <textarea name="message" id="message" rows="5" required placeholder="How can we help you?"></textarea>
                </div>
                
                <button type="submit" class="submit-btn">Send Message</button>
            </form>
        </div>

        <div class="contact-info md-content">
            <div style="background: var(--bg-secondary); padding: 30px; border-radius: 20px; border: 1px solid var(--card-border);">
                <h3 style="margin-top: 0;">Direct Email</h3>
                <p>For general questions, editorial pitches, or technical support, you can also reach us directly at:</p>
                <p><a href="mailto:contact@trend-ai.dev" style="font-size: 1.2rem; font-weight: 700;">contact@trend-ai.dev</a></p>

                <h3 style="margin-top: 30px;">Social Media</h3>
                <p>Stay connected with us for real-time updates and community discussions:</p>
                <ul>
                    <li><strong>X (formerly Twitter)</strong>: <a href="https://x.com/TrendAI">@TrendAI</a></li>
                    <li><strong>LinkedIn</strong>: <a href="https://linkedin.com/company/trend-ai">Trend-AI Intelligence</a></li>
                </ul>

                <h3 style="margin-top: 30px;">Response Time</h3>
                <p style="margin-bottom: 0;">We strive to respond to all inquiries within <strong>24-48 business hours</strong>. Thank you for your patience and for being a valued member of the Trend-AI community.</p>
            </div>
        </div>
        
    </div>

</div>

<style>
.contact-form {
    background: var(--bg-secondary);
    padding: 40px;
    border-radius: 20px;
    border: 1px solid var(--card-border);
}
@media (max-width: 600px) {
    .contact-form {
        padding: 24px;
    }
}
.form-group {
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.form-group label {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 0.95rem;
}
.form-group input,
.form-group textarea {
    width: 100%;
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    color: var(--text-primary);
    padding: 14px 20px;
    border-radius: 12px;
    font-family: inherit;
    font-size: 1rem;
    transition: border-color 0.3s, box-shadow 0.3s;
}
.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}
.submit-btn {
    width: 100%;
    background: var(--accent);
    color: white;
    border: none;
    padding: 16px 24px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 1.05rem;
    cursor: pointer;
    transition: background 0.3s, transform 0.2s;
    font-family: inherit;
}
.submit-btn:hover {
    background: var(--accent-hover);
    transform: translateY(-2px);
}
</style>
