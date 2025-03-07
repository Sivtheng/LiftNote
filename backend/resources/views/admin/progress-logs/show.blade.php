@extends('admin.layout')

@section('title', 'View Progress Log')

@section('content')
<div class="container">
    <div class="card">
        <div class="card-header">
            <h2>Progress Log Details</h2>
        </div>
        <div class="card-body">
            <div class="mb-4">
                <h3>Basic Information</h3>
                <p><strong>Title:</strong> {{ $progressLog->title }}</p>
                <p><strong>Description:</strong> {{ $progressLog->description }}</p>
                <p><strong>Date:</strong> {{ $progressLog->date->format('Y-m-d') }}</p>
            </div>

            <div class="mb-4">
                <h3>Client Information</h3>
                <p><strong>Name:</strong> {{ $progressLog->client->name }}</p>
                <p><strong>Email:</strong> {{ $progressLog->client->email }}</p>
            </div>

            <div class="mb-4">
                <h3>Program Information</h3>
                <p><strong>Title:</strong> {{ $progressLog->program->title }}</p>
                <a href="{{ route('programs.show', $progressLog->program) }}" class="btn btn-secondary btn-sm">View Program</a>
            </div>

            @if($progressLog->comments->count() > 0)
                <div class="mb-4">
                    <h3>Comments</h3>
                    @foreach($progressLog->comments as $comment)
                        <div class="comment mb-3">
                            <p><strong>{{ $comment->user->name }}</strong> - {{ $comment->created_at->format('Y-m-d H:i:s') }}</p>
                            <p>{{ $comment->content }}</p>
                        </div>
                    @endforeach
                </div>
            @endif

            <div class="mt-4">
                <a href="{{ route('progress-logs.index') }}" class="btn btn-secondary">Back to List</a>
                <form action="{{ route('progress-logs.destroy', $progressLog) }}" method="POST" style="display: inline;">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="btn btn-danger" onclick="return confirm('Are you sure?')">Delete</button>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection