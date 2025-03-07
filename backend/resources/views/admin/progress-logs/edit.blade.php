@extends('admin.layout')

@section('title', 'Edit Progress Log')

@section('content')
<div class="form-container">
    <form action="{{ route('progress-logs.update', $progressLog) }}" method="POST">
        @csrf
        @method('PUT')
        
        <div class="form-group">
            <label class="form-label">Title</label>
            <input type="text" name="title" class="form-input" value="{{ old('title', $progressLog->title) }}" required>
            @error('title')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        <div class="form-group">
            <label class="form-label">Description</label>
            <textarea name="description" class="form-input" rows="4" required>{{ old('description', $progressLog->description) }}</textarea>
            @error('description')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" name="date" class="form-input" value="{{ old('date', $progressLog->date->format('Y-m-d')) }}" required>
            @error('date')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        <div class="form-group">
            <label class="form-label">Client</label>
            <select name="client_id" class="form-input" required>
                <option value="">Select Client</option>
                @foreach($clients as $client)
                    <option value="{{ $client->id }}" 
                        {{ old('client_id', $progressLog->client_id) == $client->id ? 'selected' : '' }}>
                        {{ $client->name }}
                    </option>
                @endforeach
            </select>
            @error('client_id')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        <div class="form-group">
            <label class="form-label">Program</label>
            <select name="program_id" class="form-input" required>
                <option value="">Select Program</option>
                @foreach($programs as $program)
                    <option value="{{ $program->id }}" 
                        {{ old('program_id', $progressLog->program_id) == $program->id ? 'selected' : '' }}>
                        {{ $program->title }} (Client: {{ $program->client->name }})
                    </option>
                @endforeach
            </select>
            @error('program_id')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        <button type="submit" class="btn btn-primary">Update Progress Log</button>
        <a href="{{ route('progress-logs.index') }}" class="btn btn-secondary">Cancel</a>
    </form>
</div>
@endsection