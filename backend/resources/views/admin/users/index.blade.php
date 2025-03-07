@extends('admin.layout')

@section('title', 'Users')

@section('content')
<div class="table-container">
    <div style="margin-bottom: 1rem;">
        <a href="{{ route('users.create') }}" class="btn btn-primary" style="width: auto;">Add New User</a>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created At</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            @foreach($users as $user)
                <tr>
                    <td>{{ $user->name }}</td>
                    <td>{{ $user->email }}</td>
                    <td>{{ ucfirst($user->role) }}</td>
                    <td>{{ $user->created_at->format('Y-m-d') }}</td>
                    <td>
                        <a href="{{ route('users.edit', $user) }}" class="btn btn-primary" style="width: auto; padding: 0.25rem 0.5rem; margin-right: 0.5rem;">Edit</a>
                        <form action="{{ route('users.destroy', $user) }}" method="POST" style="display: inline;">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="btn btn-danger" style="width: auto; padding: 0.25rem 0.5rem;" onclick="return confirm('Are you sure?')">Delete</button>
                        </form>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div style="margin-top: 1rem;">
        {{ $users->links() }}
    </div>
</div>
@endsection