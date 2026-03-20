import React, { useState } from 'react'
import { Send, Mail, MessageSquare, User } from '@/components/icons'
import { ContentContainer } from './ContentContainer'
import { PrimaryButton } from './ui'
import { COPY } from '../constants/copy'
import { api } from '../utils/api'

type ContactSubject = 'cafe-suggestion' | 'correction' | 'general' | 'partnership' | 'feedback'

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState<'' | ContactSubject>('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject) return
    setError(null)
    setIsSubmitting(true)

    try {
      await api.contact.submit({
        name,
        email,
        subject,
        message,
      })
      setSubmitted(true)
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
      setTimeout(() => {
        setSubmitted(false)
      }, 4000)
    } catch {
      setError(COPY.contact.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      <div className="bg-white border-b-2 border-green-200 px-4 py-4 shadow-xs">
        <h2 className="text-2xl font-bold text-gray-800 font-caveat">{COPY.contact.pageTitle}</h2>
        <p className="text-sm text-gray-600 mt-1">{COPY.contact.pageSubtitle}</p>
      </div>

      <ContentContainer maxWidth="md">
        <div className="px-4 py-8">
          {submitted ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{COPY.contact.successTitle}</h3>
              <p className="text-gray-600">{COPY.contact.success}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xs border-2 border-green-100 p-6">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-xl text-sm" role="alert">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    {COPY.contact.nameLabel}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={COPY.contact.namePlaceholder}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    {COPY.contact.emailLabel}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={COPY.contact.emailPlaceholder}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                    {COPY.contact.subjectLabel}
                  </label>
                  <select
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as '' | ContactSubject)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:border-transparent transition appearance-none bg-white"
                    required
                  >
                    <option value="">{COPY.contact.selectTopic}</option>
                    <option value="cafe-suggestion">{COPY.contact.topicCafeSuggestion}</option>
                    <option value="correction">{COPY.contact.topicCorrection}</option>
                    <option value="general">{COPY.contact.topicGeneral}</option>
                    <option value="partnership">{COPY.contact.topicPartnership}</option>
                    <option value="feedback">{COPY.contact.topicFeedback}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    {COPY.contact.messageLabel}
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={COPY.contact.messagePlaceholder}
                      rows={6}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
                      required
                    />
                  </div>
                </div>

                <PrimaryButton type="submit" fullWidth icon={Send} disabled={isSubmitting}>
                  {isSubmitting ? COPY.contact.sending : COPY.contact.send}
                </PrimaryButton>
              </form>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-xs border-2 border-green-100 p-4 text-center">
              <Mail size={24} className="text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-800 mb-1">{COPY.contact.emailSupportHeading}</h4>
              <a href={`mailto:${COPY.contact.emailSupportAddress}`} className="text-sm text-green-600 hover:underline">
                {COPY.contact.emailSupportAddress}
              </a>
            </div>
            <div className="bg-white rounded-xl shadow-xs border-2 border-green-100 p-4 text-center">
              <svg className="w-6 h-6 text-green-600 mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <h4 className="font-semibold text-gray-800 mb-1">{COPY.contact.socialHeading}</h4>
              <a href="https://instagram.com/vivisual.diary" target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline">
                {COPY.contact.socialHandle}
              </a>
            </div>
          </div>
        </div>
      </ContentContainer>
    </div>
  )
}

export default ContactPage
