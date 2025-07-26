import React, { useState, useEffect } from 'react';
import './App.css';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
}

type FilterType = 'all' | 'active' | 'completed';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [statusMessage, setStatusMessage] = useState('');

  // Load todos from localStorage on component mount
  useEffect(() => {
    console.log('Loading todos from localStorage...');
    setStatusMessage('Loading saved todos...');
    const savedTodos = localStorage.getItem('todos');
    console.log('Saved todos from localStorage:', savedTodos);
    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos).map((todo: any) => ({
          ...todo,
          createdAt: new Date(todo.createdAt)
        }));
        console.log('Parsed todos:', parsedTodos);
        setTodos(parsedTodos);
        setStatusMessage('Todos loaded successfully!');
        setTimeout(() => setStatusMessage(''), 2000);
      } catch (error) {
        console.error('Error parsing todos from localStorage:', error);
        setStatusMessage('Error loading todos');
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } else {
      console.log('No saved todos found in localStorage');
      setStatusMessage('No saved todos found');
      setTimeout(() => setStatusMessage(''), 2000);
    }
  }, []);

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    if (todos.length > 0) {
      console.log('Saving todos to localStorage:', todos);
      setStatusMessage('Saving todos...');
      try {
        localStorage.setItem('todos', JSON.stringify(todos));
        console.log('Todos saved successfully to localStorage');
        setStatusMessage('Todos saved!');
        setTimeout(() => setStatusMessage(''), 1500);
      } catch (error) {
        console.error('Error saving todos to localStorage:', error);
        setStatusMessage('Error saving todos');
        setTimeout(() => setStatusMessage(''), 3000);
      }
    }
  }, [todos]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      const todo: Todo = {
        id: Date.now(),
        text: newTodo.trim(),
        completed: false,
        createdAt: new Date()
      };
      setTodos([...todos, todo]);
      setNewTodo('');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed));
  };

  const clearAllData = () => {
    localStorage.removeItem('todos');
    setTodos([]);
    setStatusMessage('All data cleared!');
    setTimeout(() => setStatusMessage(''), 2000);
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const activeTodosCount = todos.filter(todo => !todo.completed).length;
  const completedTodosCount = todos.filter(todo => todo.completed).length;

  return (
    <div className="App">
      <div className="todo-container">
        <h1>Todo List</h1>
        
        {statusMessage && (
          <div className={`status-message ${
            statusMessage.includes('saved') || statusMessage.includes('loaded successfully') ? 'success' :
            statusMessage.includes('Error') ? 'error' : 'info'
          }`}>
            {statusMessage}
          </div>
        )}
        
        {/* Add Todo Form */}
        <form onSubmit={addTodo} className="add-todo-form">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="What needs to be done?"
            className="todo-input"
          />
          <button type="submit" className="add-button">
            Add
          </button>
        </form>

        {/* Todo List */}
        <div className="todo-list">
          {filteredTodos.map(todo => (
            <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="todo-checkbox"
              />
              <span className="todo-text">{todo.text}</span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="delete-button"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Filters and Stats */}
        {todos.length > 0 && (
          <div className="todo-footer">
            <div className="todo-stats">
              {activeTodosCount} item{activeTodosCount !== 1 ? 's' : ''} left
            </div>
            
            <div className="todo-filters">
              <button
                className={`filter-button ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-button ${filter === 'active' ? 'active' : ''}`}
                onClick={() => setFilter('active')}
              >
                Active
              </button>
              <button
                className={`filter-button ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Completed
              </button>
            </div>

            {completedTodosCount > 0 && (
              <button onClick={clearCompleted} className="clear-completed">
                Clear completed
              </button>
            )}
            
            <button onClick={clearAllData} className="clear-all-data">
              Clear all data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
