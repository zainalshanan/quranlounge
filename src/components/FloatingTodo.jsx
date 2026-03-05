import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, CheckCircle, Circle, X } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';

export default function FloatingTodo() {
  const { todos, addTodo, toggleTodo, deleteTodo, setFloatingTodo, widgetStyle } = usePlayerStore();
  const [newTask, setNewTask] = useState('');

  const completedCount = todos.filter(t => t.completed).length;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    addTodo(newTask.trim());
    setNewTask('');
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`floating-widget floating-todo widget-${widgetStyle}`}
    >
      <div className="fw-header">
        <span className="fw-title">Tasks {todos.length > 0 ? `(${completedCount}/${todos.length})` : ''}</span>
        <button className="fw-close" onClick={() => setFloatingTodo(false)}><X size={14} /></button>
      </div>

      <div className="fw-todo-list">
        {todos.map(todo => (
          <div key={todo.id} className={`fw-todo-item ${todo.completed ? 'done' : ''}`}>
            <button onClick={() => toggleTodo(todo.id)}>
              {todo.completed ? <CheckCircle size={16} /> : <Circle size={16} />}
            </button>
            <span>{todo.text}</span>
            <button className="fw-todo-del" onClick={() => deleteTodo(todo.id)}>
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      <form className="fw-todo-add" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Add task..."
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
        />
        <button type="submit" disabled={!newTask.trim()}><Plus size={14} /></button>
      </form>
    </motion.div>
  );
}
