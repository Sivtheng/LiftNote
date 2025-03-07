@extends('admin.layout')

@section('title', 'Create Questionnaire')

@section('content')
<div class="form-container">
    <form action="{{ route('questionnaires.store') }}" method="POST">
        @csrf
        <div class="form-group">
            <label class="form-label">Client</label>
            <select name="client_id" class="form-input" required>
                <option value="">Select Client</option>
                @foreach($clients as $client)
                    <option value="{{ $client->id }}" {{ old('client_id') == $client->id ? 'selected' : '' }}>
                        {{ $client->name }}
                    </option>
                @endforeach
            </select>
            @error('client_id')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        <div class="form-group">
            <label class="form-label">Status</label>
            <select name="status" class="form-input" required>
                <option value="pending" {{ old('status') == 'pending' ? 'selected' : '' }}>Pending</option>
                <option value="completed" {{ old('status') == 'completed' ? 'selected' : '' }}>Completed</option>
                <option value="reviewed" {{ old('status') == 'reviewed' ? 'selected' : '' }}>Reviewed</option>
            </select>
            @error('status')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        <h3 class="mt-4 mb-3">Questions</h3>
        @foreach($questions as $key => $question)
            <div class="form-group">
                <label class="form-label">{{ $question }}</label>
                <input type="text" name="answers[{{ $key }}]" class="form-input" 
                    value="{{ old('answers.'.$key) }}" required>
                @error('answers.'.$key)
                    <span class="error">{{ $message }}</span>
                @enderror
            </div>
        @endforeach

        <button type="submit" class="btn btn-primary">Create Questionnaire</button>
        <a href="{{ route('questionnaires.index') }}" class="btn btn-secondary">Cancel</a>
    </form>
</div>
@endsection