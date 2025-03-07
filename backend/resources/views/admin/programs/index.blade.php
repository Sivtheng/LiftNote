@extends('admin.layout')

@section('title', 'Programs')

@section('content')
<div class="table-container">
    <div style="margin-bottom: 1rem;">
        <a href="{{ route('programs.create') }}" class="btn btn-primary" style="width: auto;">Add New Program</a>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Title</th>
                <th>Coach</th>
                <th>Client</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            @foreach($programs as $program)
                <tr>
                    <td>{{ $program->title }}</td>
                    <td>{{ $program->coach->name }}</td>
                    <td>{{ $program->client->name }}</td>
                    <td>{{ ucfirst($program->status) }}</td>
                    <td>{{ $program->created_at->format('Y-m-d') }}</td>
                    <td>
                        <a href="{{ route('programs.show', $program) }}" class="btn btn-secondary" style="width: auto; padding: 0.25rem 0.5rem; margin-right: 0.25rem;">View</a>
                        <a href="{{ route('programs.edit', $program) }}" class="btn btn-primary" style="width: auto; padding: 0.25rem 0.5rem; margin-right: 0.25rem;">Edit</a>
                        <form action="{{ route('programs.destroy', $program) }}" method="POST" style="display: inline;">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="btn btn-danger" style="width: auto; padding: 0.25rem 0.5rem;" 
                                onclick="return confirm('Are you sure? This action cannot be undone.')">
                                Delete
                            </button>
                        </form>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div style="margin-top: 1rem;">
        {{ $programs->links() }}
    </div>
</div>
@endsection