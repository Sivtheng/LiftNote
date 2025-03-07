@extends('admin.layout')

@section('title', 'View Questionnaire')

@section('content')
<div class="container">
    <div class="card">
        <div class="card-header">
            <h2>Questionnaire Details</h2>
        </div>
        <div class="card-body">
            <div class="mb-4">
                <h3>Client Information</h3>
                <p><strong>Name:</strong> {{ $questionnaire->client->name }}</p>
                <p><strong>Email:</strong> {{ $questionnaire->client->email }}</p>
                <p><strong>Status:</strong> {{ ucfirst($questionnaire->status) }}</p>
                <p><strong>Submitted:</strong> {{ $questionnaire->updated_at->format('Y-m-d H:i:s') }}</p>
            </div>

            <div class="mb-4">
                <h3>Answers</h3>
                @foreach($questions as $key => $question)
                    <div class="mb-3">
                        <p><strong>{{ $question }}</strong></p>
                        <p>{{ $questionnaire->answers[$key] ?? 'Not answered' }}</p>
                    </div>
                @endforeach
            </div>

            <div class="mt-4">
                <a href="{{ route('questionnaires.index') }}" class="btn btn-secondary">Back to List</a>
                <form action="{{ route('questionnaires.destroy', $questionnaire) }}" method="POST" style="display: inline;">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="btn btn-danger" onclick="return confirm('Are you sure?')">Delete</button>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection