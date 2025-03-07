@extends('admin.layout')

@section('title', 'Edit Program')

@section('content')
<div class="form-container">
    <form action="{{ route('programs.update', $program) }}" method="POST">
        @csrf
        @method('PUT')
        
        <div class="form-group">
            <label class="form-label">Title</label>
            <input type="text" name="title" class="form-input" value="{{ old('title', $program->title) }}" required>
            @error('title')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        <div class="form-group">
            <label class="form-label">Description</label>
            <textarea name="description" class="form-input" required>{{ old('description', $program->description) }}</textarea>
            @error('description')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        <div class="form-group">
            <label class="form-label">Coach</label>
            <select name="coach_id" class="form-input" required>
                <option value="">Select Coach</option>
                @foreach($coaches as $coach)
                    <option value="{{ $coach->id }}" 
                        {{ old('coach_id', $program->coach_id) == $coach->id ? 'selected' : '' }}>
                        {{ $coach->name }}
                    </option>
                @endforeach
            </select>
            @error('coach_id')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        <div class="form-group">
            <label class="form-label">Client</label>
            <select name="client_id" class="form-input" required>
                <option value="">Select Client</option>
                @foreach($clients as $client)
                    <option value="{{ $client->id }}" 
                        {{ old('client_id', $program->client_id) == $client->id ? 'selected' : '' }}>
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
                <option value="active" {{ old('status', $program->status) == 'active' ? 'selected' : '' }}>Active</option>
                <option value="completed" {{ old('status', $program->status) == 'completed' ? 'selected' : '' }}>Completed</option>
                <option value="cancelled" {{ old('status', $program->status) == 'cancelled' ? 'selected' : '' }}>Cancelled</option>
            </select>
            @error('status')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        <button type="submit" class="btn btn-primary">Update Program</button>
        <a href="{{ route('programs.index') }}" class="btn btn-secondary">Cancel</a>
    </form>
</div>
@endsection