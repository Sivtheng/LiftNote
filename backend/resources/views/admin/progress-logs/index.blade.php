@extends('admin.layout')

@section('title', 'Progress Logs')

@section('content')
<div class="table-container">
    <div style="margin-bottom: 1rem;">
        <a href="{{ route('progress-logs.create') }}" class="btn btn-primary" style="width: auto;">Add New Progress Log</a>
    </div>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Client</th>
                <th>Program</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            @foreach($progressLogs as $log)
                <tr>
                    <td>{{ $log->date->format('Y-m-d') }}</td>
                    <td>{{ $log->title }}</td>
                    <td>{{ $log->client->name }}</td>
                    <td>{{ $log->program->title }}</td>
                    <td>
                        <a href="{{ route('progress-logs.show', $log) }}" class="btn btn-secondary" style="width: auto; padding: 0.25rem 0.5rem; margin-right: 0.25rem;">View</a>
                        <a href="{{ route('progress-logs.edit', $log) }}" class="btn btn-primary" style="width: auto; padding: 0.25rem 0.5rem; margin-right: 0.25rem;">Edit</a>
                        <form action="{{ route('progress-logs.destroy', $log) }}" method="POST" style="display: inline;">
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
        {{ $progressLogs->links() }}
    </div>
</div>
@endsection