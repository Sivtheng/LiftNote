'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Client } from '@/types/client';
import Navbar from '../components/Navbar';
import Image from 'next/image';
import Link from 'next/link';
import { API_CONFIG, getAuthHeaders } from '@/config/api';

interface AddClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (clientData: { name: string; email: string; password: string }) => Promise<void>;
}

function AddClientModal({ isOpen, onClose, onAdd }: AddClientModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setFieldErrors({});

        try {
            await onAdd(formData);
            setFormData({ name: '', email: '', password: '' });
            onClose();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to add client';
            setError(errorMessage);
            
            // Parse field-specific errors if available
            if (errorMessage.includes('Validation failed:')) {
                const lines = errorMessage.split('\n').slice(1); // Skip "Validation failed:" line
                const errors: {[key: string]: string} = {};
                
                lines.forEach(line => {
                    const [field, message] = line.split(': ');
                    if (field && message) {
                        const fieldKey = field.toLowerCase();
                        errors[fieldKey] = message;
                    }
                });
                
                setFieldErrors(errors);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const getFieldError = (fieldName: string) => {
        return fieldErrors[fieldName] || '';
    };

    const getInputClassName = (fieldName: string) => {
        const baseClass = "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black";
        return getFieldError(fieldName) 
            ? `${baseClass} border-red-300 focus:border-red-500 focus:ring-red-500`
            : `${baseClass} border-gray-300`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl transform transition-all">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Add New Client</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                        <div className="font-medium mb-1">Error:</div>
                        <div className="whitespace-pre-line text-sm">{error}</div>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                            Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={getInputClassName('name')}
                            required
                        />
                        {getFieldError('name') && (
                            <p className="mt-1 text-sm text-red-600">{getFieldError('name')}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className={getInputClassName('email')}
                            required
                        />
                        {getFieldError('email') && (
                            <p className="mt-1 text-sm text-red-600">{getFieldError('email')}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className={getInputClassName('password')}
                            required
                        />
                        {getFieldError('password') && (
                            <p className="mt-1 text-sm text-red-600">{getFieldError('password')}</p>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Client'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ClientListPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<{ id: number; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedPrograms, setSelectedPrograms] = useState<{ [clientId: number]: number | undefined }>({});

    useEffect(() => {
        const fetchClients = async () => {
            try {
                setIsLoading(true);
                setError('');

                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }
                
                const response = await fetch(`${API_CONFIG.BASE_URL}/users`, {
                    headers: getAuthHeaders(token)
                });

                const data = await response.json();

                if (response.status === 401) {
                    throw new Error('Authentication failed. Please log in again.');
                }

                if (response.status === 403) {
                    throw new Error('You do not have permission to access this page.');
                }

                if (!response.ok) {
                    throw new Error(data.message || `HTTP error! status: ${response.status}`);
                }

                if (!data.users) {
                    throw new Error('No users data received from the server');
                }

                setClients(data.users);
            } catch (error) {
                console.error('Detailed error:', error);
                setError(error instanceof Error ? error.message : 'Failed to fetch clients');
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchClients();
        }
    }, [isAuthenticated]);

    const handleAddClient = async (clientData: { name: string; email: string; password: string }) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            const response = await fetch(`${API_CONFIG.BASE_URL}/users`, {
                method: 'POST',
                headers: getAuthHeaders(token),
                body: JSON.stringify(clientData)
            });

            if (!response.ok) {
                const data = await response.json();
                
                // Check if it's a validation error with detailed messages
                if (response.status === 422 && data.errors) {
                    // Parse validation errors and create a detailed message
                    const errorMessages = Object.entries(data.errors).map(([field, messages]) => {
                        const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
                        const messageList = Array.isArray(messages) ? messages.join(', ') : messages;
                        return `${fieldName}: ${messageList}`;
                    }).join('\n');
                    
                    throw new Error(`Validation failed:\n${errorMessages}`);
                }
                
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            // Refresh the client list
            const updatedResponse = await fetch(`${API_CONFIG.BASE_URL}/users`, {
                headers: getAuthHeaders(token)
            });

            const updatedData = await updatedResponse.json();
            setClients(updatedData.users);
        } catch (error) {
            console.error('Error adding client:', error);
            throw error;
        }
    };

    const handleDeleteClick = (client: { id: number; name: string }) => {
        setClientToDelete(client);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!clientToDelete) return;
        
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            const response = await fetch(`${API_CONFIG.BASE_URL}/users/${clientToDelete.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(token)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete client');
            }

            // Remove the deleted client from the list
            setClients(clients.filter(client => client.id !== clientToDelete.id));
            setIsDeleteModalOpen(false);
            setClientToDelete(null);
        } catch (error) {
            console.error('Error deleting client:', error);
            alert('Failed to delete client. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Helper to get the selected program for a client
    const getSelectedProgram = (client: Client) => {
        const selectedId = selectedPrograms[client.id];
        if (selectedId && client.client_programs) {
            return client.client_programs.find(p => p.id === selectedId);
        }
        // Default to current_program or first in client_programs
        if (client.current_program) return client.current_program;
        if (client.client_programs && client.client_programs.length > 0) return client.client_programs[0];
        return undefined;
    };

    if (isAuthLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-black">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-black">Clients</h1>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Add Client
                        </button>
                    </div>

                    <AddClientModal
                        isOpen={isAddModalOpen}
                        onClose={() => setIsAddModalOpen(false)}
                        onAdd={handleAddClient}
                    />

                    {/* Delete Confirmation Modal */}
                    {isDeleteModalOpen && clientToDelete && (
                        <div className="fixed inset-0 z-50 overflow-y-auto">
                            <div className="flex min-h-screen items-center justify-center p-4 text-center">
                                <div className="fixed inset-0 backdrop-blur-sm bg-black/30" onClick={() => setIsDeleteModalOpen(false)}></div>
                                <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                    <div className="absolute right-0 top-0 pr-4 pt-4">
                                        <button
                                            type="button"
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                                            onClick={() => setIsDeleteModalOpen(false)}
                                        >
                                            <span className="sr-only">Close</span>
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                            </svg>
                                        </div>
                                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                            <h3 className="text-base font-semibold leading-6 text-gray-900">Delete Client</h3>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500">
                                                    Are you sure you want to delete {clientToDelete.name}? This action cannot be undone.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                        <button
                                            type="button"
                                            className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={handleDeleteConfirm}
                                            disabled={isDeleting}
                                        >
                                            {isDeleting ? 'Deleting...' : 'Delete'}
                                        </button>
                                        <button
                                            type="button"
                                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                            onClick={() => setIsDeleteModalOpen(false)}
                                            disabled={isDeleting}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    {clients.length === 0 ? (
                        <div className="bg-white shadow rounded-lg p-6 text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Clients Found</h3>
                            <p className="text-gray-500 mb-4">You don't have any clients yet. Clients will appear here once they register.</p>
                        </div>
                    ) : (
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Program
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Assignment Date
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {clients.flatMap((client) => {
                                        if (client.client_programs && client.client_programs.length > 0) {
                                            return client.client_programs.map((program) => (
                                                <tr key={`${client.id}-${program.id}`} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                {client.profile_picture ? (
                                                                    <img
                                                                        src={client.profile_picture}
                                                                        alt={client.name + "'s profile"}
                                                                        className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                                                    />
                                                                ) : (
                                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                                        <span className="text-lg font-medium text-indigo-600">
                                                                            {client.name.charAt(0).toUpperCase()}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">{client.name}</div>
                                                                <div className="text-sm text-gray-500">{client.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{program.title}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {program.created_at ? new Date(program.created_at).toLocaleDateString() : 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <Link
                                                            href={`/client/${client.id}`}
                                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                        >
                                                            View
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteClick(client)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ));
                                        } else {
                                            // No programs for this client
                                            return (
                                                <tr key={`${client.id}-no-program`} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                {client.profile_picture ? (
                                                                    <img
                                                                        src={client.profile_picture}
                                                                        alt={client.name + "'s profile"}
                                                                        className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                                                    />
                                                                ) : (
                                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                                        <span className="text-lg font-medium text-indigo-600">
                                                                            {client.name.charAt(0).toUpperCase()}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">{client.name}</div>
                                                                <div className="text-sm text-gray-500">{client.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">No program assigned</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">N/A</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <Link
                                                            href={`/client/${client.id}`}
                                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                        >
                                                            View
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteClick(client)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 