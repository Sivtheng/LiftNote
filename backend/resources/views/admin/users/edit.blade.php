@extends('admin.layout')

@section('title', 'Edit User')

@section('content')
<div class="form-container">
    <form action="{{ route('users.update', $user) }}" method="POST">
        @csrf
        @method('PUT')
        
        <div class="form-group">
            <label class="form-label">Name</label>
            <input type="text" name="name" class="form-input" value="{{ old('name', $user->name) }}" required>
            @error('name')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" name="email" class="form-input" value="{{ old('email', $user->email) }}" required>
            @error('email')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" name="password" class="form-input" placeholder="Leave blank to keep current password">
            @error('password')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        <div class="form-group">
            <label class="form-label">Confirm Password</label>
            <input type="password" name="password_confirmation" class="form-input" placeholder="Leave blank to keep current password">
        </div>

        <div class="form-group">
            <label class="form-label">Role</label>
            <select name="role" class="form-input" required>
                <option value="client" {{ old('role', $user->role) === 'client' ? 'selected' : '' }}>Client</option>
                <option value="coach" {{ old('role', $user->role) === 'coach' ? 'selected' : '' }}>Coach</option>
                <option value="admin" {{ old('role', $user->role) === 'admin' ? 'selected' : '' }}>Admin</option>
            </select>
            @error('role')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="text" name="phone_number" class="form-input" value="{{ old('phone_number', $user->phone_number) }}">
            @error('phone_number')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        <div class="form-group">
            <label class="form-label">Bio</label>
            <textarea name="bio" class="form-input">{{ old('bio', $user->bio) }}</textarea>
            @error('bio')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        <div class="form-group">
            <label class="form-label">Profile Picture URL</label>
            <input type="text" name="profile_picture" class="form-input" value="{{ old('profile_picture', $user->profile_picture) }}">
            @error('profile_picture')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        <button type="submit" class="btn btn-primary">Update User</button>
    </form>
</div>
@endsection