'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = 'http://localhost:8000/api';
const SANCTUM_COOKIE_URL = 'http://localhost:8000';

interface Question {
    id: number;
    key: string;
    question: string;
    type: string;
    options: string[] | null;
    is_required: boolean;
    order: number;
}

export default function QuestionnairePage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [formData, setFormData] = useState({
        key: '',
        question: '',
        type: 'text',
        options: [] as string[],
        is_required: true,
        order: 0
    });

    const getCsrfToken = async () => {
        try {
            const response = await fetch(`${SANCTUM_COOKIE_URL}/sanctum/csrf-cookie`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                mode: 'cors',
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch CSRF token: ${response.status}`);
            }

            const xsrfToken = document.cookie
                .split(';')
                .find(cookie => cookie.trim().startsWith('XSRF-TOKEN='))
                ?.split('=')[1];

            if (!xsrfToken) {
                throw new Error('XSRF-TOKEN cookie not set');
            }

            return decodeURIComponent(xsrfToken);
        } catch (error) {
            console.error('Error fetching CSRF token:', error);
            throw error;
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchQuestions();
        }
    }, [isAuthenticated]);

    const fetchQuestions = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const xsrfToken = await getCsrfToken();
            console.log('Fetching questions with token:', token.substring(0, 10) + '...');
            
            const response = await fetch(`${API_URL}/questionnaires/questions`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': xsrfToken
                },
                credentials: 'include',
                mode: 'cors'
            });
            
            console.log('Response status:', response.status);
            const responseData = await response.json().catch(() => ({}));
            console.log('Response data:', responseData);
            
            if (response.status === 401) {
                throw new Error('Authentication failed. Please log in again.');
            }

            if (response.status === 403) {
                throw new Error('You do not have permission to access this page. Only coaches and admins can manage questions.');
            }

            if (!response.ok) {
                throw new Error(responseData.message || `Failed to fetch questions (Status: ${response.status})`);
            }

            if (!Array.isArray(responseData.questions)) {
                console.error('Unexpected response format:', responseData);
                throw new Error('Invalid response format from server');
            }

            setQuestions(responseData.questions);
        } catch (error) {
            console.error('Error fetching questions:', error);
            setError(error instanceof Error ? error.message : 'Failed to load questions');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const xsrfToken = await getCsrfToken();
            const response = await fetch(`${API_URL}/questionnaires/questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': xsrfToken
                },
                credentials: 'include',
                mode: 'cors',
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update question');
            }

            await fetchQuestions();
            resetForm();
            setEditingQuestion(null);
        } catch (error) {
            console.error('Error updating question:', error);
            setError(error instanceof Error ? error.message : 'Failed to update question');
        }
    };

    const handleDelete = async (key: string) => {
        if (!confirm('Are you sure you want to delete this question?')) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const xsrfToken = await getCsrfToken();
            const response = await fetch(`${API_URL}/questionnaires/questions`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': xsrfToken
                },
                credentials: 'include',
                mode: 'cors',
                body: JSON.stringify({ key })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to delete question');
            }

            await fetchQuestions();
        } catch (error) {
            console.error('Error deleting question:', error);
            setError(error instanceof Error ? error.message : 'Failed to delete question');
        }
    };

    const handleEdit = (question: Question) => {
        setEditingQuestion(question);
        setFormData({
            key: question.key,
            question: question.question,
            type: question.type,
            options: question.options || [],
            is_required: question.is_required,
            order: question.order
        });
    };

    const resetForm = () => {
        setFormData({
            key: '',
            question: '',
            type: 'text',
            options: [],
            is_required: true,
            order: 0
        });
    };

    if (isAuthLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Questionnaire Questions</h1>
                    <button
                        onClick={() => {
                            setEditingQuestion(null);
                            resetForm();
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Add New Question
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-8">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Key</label>
                            <input
                                type="text"
                                value={formData.key}
                                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-black"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Question</label>
                            <input
                                type="text"
                                value={formData.question}
                                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-black"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-black"
                            >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="select">Select</option>
                                <option value="textarea">Textarea</option>
                            </select>
                        </div>

                        {formData.type === 'select' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Options</label>
                                <div className="space-y-2 mt-1">
                                    {formData.options.map((option, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={option}
                                                onChange={(e) => {
                                                    const newOptions = [...formData.options];
                                                    newOptions[index] = e.target.value;
                                                    setFormData({ ...formData, options: newOptions });
                                                }}
                                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-black"
                                                placeholder={`Option ${index + 1}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newOptions = formData.options.filter((_, i) => i !== index);
                                                    setFormData({ ...formData, options: newOptions });
                                                }}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({ ...formData, options: [...formData.options, ''] });
                                        }}
                                        className="text-indigo-600 hover:text-indigo-900 text-sm"
                                    >
                                        + Add Option
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.is_required}
                                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-900">Required</label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Order</label>
                            <input
                                type="number"
                                value={formData.order || ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData({ 
                                        ...formData, 
                                        order: value === '' ? 0 : parseInt(value)
                                    });
                                }}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-black"
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                {editingQuestion ? 'Update Question' : 'Add Question'}
                            </button>
                        </div>
                    </div>
                </form>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {questions.map((question) => (
                                <tr key={question.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.order}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{question.key}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{question.question}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {question.is_required ? 'Yes' : 'No'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(question)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(question.key)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
} 