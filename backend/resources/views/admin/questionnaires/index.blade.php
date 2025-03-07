@extends('admin.layout')

@section('title', 'Questionnaires')

@section('content')
<div class="table-container">
    <div style="margin-bottom: 1rem;">
        <a href="{{ route('questionnaires.create') }}" class="btn btn-primary" style="width: auto;">Add New Questionnaire</a>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Client</th>
                <th>Status</th>
                <th>Submitted At</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            @foreach($questionnaires as $questionnaire)
                <tr>
                    <td>{{ $questionnaire->client->name }}</td>
                    <td>{{ ucfirst($questionnaire->status) }}</td>
                    <td>{{ $questionnaire->updated_at->format('Y-m-d') }}</td>
                    <td>
                        <a href="{{ route('questionnaires.show', $questionnaire) }}" class="btn btn-secondary" style="width: auto; padding: 0.25rem 0.5rem; margin-right: 0.25rem;">View</a>
                        <a href="{{ route('questionnaires.edit', $questionnaire) }}" class="btn btn-primary" style="width: auto; padding: 0.25rem 0.5rem; margin-right: 0.25rem;">Edit</a>
                        <form action="{{ route('questionnaires.destroy', $questionnaire) }}" method="POST" style="display: inline;">
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
        {{ $questionnaires->links() }}
    </div>
</div>
@endsection