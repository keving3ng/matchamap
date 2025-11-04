import React, { useState } from 'react'
import { Send, Mail, MessageSquare, User } from '@/components/icons'
import { ContentContainer } from './ContentContainer'

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement contact form submission
    console.log('Contact form submitted:', { name, email, subject, message })
    setSubmitted(true)

    // Reset form after 3 seconds
    setTimeout(() => {
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
      setSubmitted(false)
    }, 3000)
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-white border-b-2 border-green-200 px-4 py-4 shadow-xs">
        <h2 className="text-2xl font-bold text-gray-800 font-caveat">Contact Us</h2>
        <p className="text-sm text-gray-600 mt-1">Have a question or want to suggest a cafe?</p>
      </div>

      <ContentContainer maxWidth="md">
        <div className="px-4 py-8">
          {submitted ? (
            /* Success Message */
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Message Sent!</h3>
              <p className="text-gray-600">Thanks for reaching out. We&apos;ll get back to you soon!</p>
            </div>
          ) : (
            /* Contact Form */
            <div className="bg-white rounded-2xl shadow-xs border-2 border-green-100 p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                      required
                    />
                  </div>
                </div>

                {/* Subject Field */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:border-transparent transition appearance-none bg-white"
                    required
                  >
                    <option value="">Select a topic...</option>
                    <option value="cafe-suggestion">Suggest a Cafe</option>
                    <option value="correction">Report an Error</option>
                    <option value="general">General Inquiry</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>

                {/* Message Field */}
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    Message
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us more..."
                      rows={6}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-600 transition shadow-xs flex items-center justify-center gap-2"
                >
                  <Send size={20} />
                  Send Message
                </button>
              </form>
            </div>
          )}

          {/* Contact Info */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-xs border-2 border-green-100 p-4 text-center">
              <Mail size={24} className="text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-800 mb-1">Email</h4>
              <a href="mailto:hello@matchamap.com" className="text-sm text-green-600 hover:underline">
                hello@matchamap.com
              </a>
            </div>
            <div className="bg-white rounded-xl shadow-xs border-2 border-green-100 p-4 text-center">
              <svg className="w-6 h-6 text-green-600 mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <h4 className="font-semibold text-gray-800 mb-1">Social</h4>
              <a href="https://instagram.com/vivisual.diary" target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline">
                @vivisual.diary
              </a>
            </div>
          </div>
        </div>
      </ContentContainer>
    </div>
  )
}

export default ContactPage
