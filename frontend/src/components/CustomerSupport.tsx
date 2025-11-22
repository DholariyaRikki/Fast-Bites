import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Textarea from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Send,
  Clock,
  Reply,
  User,
  Calendar
} from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import axios from 'axios';

interface Message {
  _id: string;
  subject: string;
  message: string;
  status: 'pending' | 'resolved' | 'in-progress';
  adminReply?: {
    adminId: string;
    message: string;
    timestamp: string;
  };
  createdAt: string;
  updatedAt: string;
  userId: {
    fullname: string;
    email: string;
  };
}

const CustomerSupport: React.FC = () => {
  const { user, isAuthenticated } = useUserStore();
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please login to send a message');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post('http://localhost:3350/api/message/create', {
        subject: formData.subject,
        message: formData.message
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      if (response.data.success) {
        setSubmitSuccess(true);
        setFormData({
          subject: '',
          message: ''
        });
        setTimeout(() => setSubmitSuccess(false), 3000);
      }
    } catch (error: any) {
      console.error('Error submitting message:', error);
      alert(error.response?.data?.message || 'Failed to submit message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserMessages();
    }
  }, [isAuthenticated]);

  const fetchUserMessages = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3350/api/message/my-messages', {
        withCredentials: true
      });
      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      alert(error.response?.data?.message || 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      const response = await axios.put(
        `http://localhost:3350/api/message/${selectedMessage._id}/reply`,
        { replyMessage: replyText },
        { withCredentials: true }
      );

      if (response.data.success) {
        setReplyText('');
        setSelectedMessage(response.data.data);
        fetchUserMessages(); // Refresh messages
        alert('Reply sent successfully!');
      }
    } catch (error: any) {
      console.error('Error sending reply:', error);
      alert(error.response?.data?.message || 'Failed to send reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Login Required</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Please login to view your support messages.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How Can We Help You?</h1>
          <p className="text-lg text-gray-600">We're here to assist you with any questions or concerns</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form Section */}
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-orange mb-4">
                <MessageSquare className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Send us a Message</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {isAuthenticated ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Logged in as: {user?.fullname}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Please login to send support messages</span>
                    </div>
                  </div>
                )}


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <Input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What's your question about?"
                    required
                    disabled={!isAuthenticated || isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Please describe your issue or question in detail"
                    rows={4}
                    required
                    disabled={!isAuthenticated || isSubmitting}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange hover:bg-orange/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isAuthenticated || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>

                {submitSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Message sent successfully! We'll get back to you soon.</span>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Messages Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Support Messages</h2>
              <Button onClick={fetchUserMessages} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : messages.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No messages yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You haven't sent any support messages yet.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <Card
                    key={message._id}
                    className={`cursor-pointer transition-colors ${
                      selectedMessage?._id === message._id ? 'ring-2 ring-orange-500' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{message.subject}</CardTitle>
                          <CardDescription className="mt-1">
                            {message.message.substring(0, 100)}...
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(message.status)}>
                          {message.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(message.createdAt)}
                        </div>
                        {message.adminReply && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Reply className="h-4 w-4" />
                            Admin replied
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Detail Section */}
        {selectedMessage && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedMessage.subject}</CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {selectedMessage.userId.fullname} ({selectedMessage.userId.email})
                      </div>
                      {selectedMessage.adminReply && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <span className="text-green-600">•</span>
                          <span>Admin replied by {selectedMessage.adminReply.adminId ? 'Admin' : 'System'}</span>
                        </div>
                      )}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(selectedMessage.status)}>
                    {selectedMessage.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Original Message</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedMessage.message}</p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      Sent on {formatDate(selectedMessage.createdAt)}
                    </div>
                  </div>
                </div>

                {selectedMessage.adminReply && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Reply className="h-4 w-4 text-green-600" />
                      Admin Reply
                    </h4>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-gray-700">{selectedMessage.adminReply.message}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        Replied on {formatDate(selectedMessage.adminReply.timestamp)}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <User className="h-4 w-4" />
                        <span>Replied by: {selectedMessage.adminReply.adminId ? 'Admin' : 'System'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reply Form */}
                {selectedMessage.status !== 'resolved' && (
                  <form onSubmit={handleReply} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add Reply
                      </label>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply here..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        disabled={isSubmittingReply}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={!replyText.trim() || isSubmittingReply}
                      className="bg-orange hover:bg-orange/90"
                    >
                      {isSubmittingReply ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Status Indicators */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <span>Order System: Operational</span>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <span>Payment System: Operational</span>
            </div>
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="w-5 h-5" />
              <span>Delivery System: High Load</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSupport; 
