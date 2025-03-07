@extends('admin.layout')

@section('title', 'View Program')

@section('content')
<div class="container">
    <div class="card">
        <div class="card-header">
            <h2>Program Details</h2>
        </div>
        <div class="card-body">
            <div class="mb-4">
                <h3>Basic Information</h3>
                <p><strong>Title:</strong> {{ $program->title }}</p>
                <p><strong>Description:</strong> {{ $program->description }}</p>
                <p><strong>Status:</strong> {{ ucfirst($program->status) }}</p>
                <p><strong>Created:</strong> {{ $program->created_at->format('Y-m-d H:i:s') }}</p>
            </div>

            <div class="mb-4">
                <h3>Coach Information</h3>
                <p><strong>Name:</strong> {{ $program->coach->name }}</p>
                <p><strong>Email:</strong> {{ $program->coach->email }}</p>
            </div>

            <div class="mb-4">
                <h3>Client Information</h3>
                <p><strong>Name:</strong> {{ $program->client->name }}</p>
                <p><strong>Email:</strong> {{ $program->client->email }}</p>
            </div>

            <div class="mb-4">
                <h3>Progress Logs</h3>
                @if($program->progressLogs->count() > 0)
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Title</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($program->progressLogs as $log)
                                <tr>
                                    <td>{{ $log->date->format('Y-m-d') }}</td>
                                    <td>{{ $log->title }}</td>
                                    <td>
                                        <a href="{{ route('progress-logs.show', $log) }}" class="btn btn-secondary btn-sm">View</a>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @else
                    <p>No progress logs yet.</p>
                @endif
            </div>

            <div class="mt-4">
                <a href="{{ route('programs.index') }}" class="btn btn-secondary">Back to List</a>
                <a href="{{ route('programs.edit', $program) }}" class="btn btn-primary">Edit Program</a>
                <form action="{{ route('programs.destroy', $program) }}" method="POST" style="display: inline;">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="btn btn-danger" 
                        onclick="return confirm('Are you sure? This will permanently delete this program and all related data.')">
                        Delete Program
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection