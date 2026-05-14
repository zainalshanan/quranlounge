import { useState } from 'react';
import { Plus, Trash2, CheckCircle, Circle } from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';

export default function TodoPanel() {
  const { todos, addTodo, toggleTodo, deleteTodo } = usePlayerStore();
  const [newTask, setNewTask] = useState('');

  const completedCount = todos.filter(t => t.completed).length;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    addTodo(newTask.trim());
    setNewTask('');
  };

  return (
    <div className="panel-content">
      <h3 className="panel-title">Daily Goals</h3>
      {todos.length > 0 && (
        <p className="panel-subtitle">{completedCount}/{todos.length} completed</p>
      )}

      {/* Progress bar */}
      {todos.length > 0 && (
        <div className="todo-progress-bar">
          <div
            className="todo-progress-fill"
            style={{ width: `${(completedCount / todos.length) * 100}%` }}
          />
        </div>
      )}

      {/* Todo List */}
      <div className="todo-list">
        {todos.map(todo => (
          <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
            <button className="todo-check" onClick={() => toggleTodo(todo.id)} aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}>
              {todo.completed ? <CheckCircle size={18} /> : <Circle size={18} />}
            </button>
            <span className="todo-text">{todo.text}</span>
            <button className="todo-delete" onClick={() => deleteTodo(todo.id)} aria-label="Delete task">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Add Task */}
      <form className="todo-add" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Add new task..."
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
        />
        <button type="submit" disabled={!newTask.trim()} aria-label="Add task">
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
}
