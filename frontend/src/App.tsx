import React, { useState, useEffect } from 'react';
import './App.css';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
  parentId?: number; // For nested todos
  children?: Todo[]; // For easier rendering
}

type FilterType = 'all' | 'active' | 'completed';

// Helper function to build tree structure from flat array
const buildTodoTree = (todos: Todo[]): Todo[] => {
  const todoMap = new Map<number, Todo>();
  const rootTodos: Todo[] = [];

  // First pass: create map of all todos
  todos.forEach(todo => {
    todoMap.set(todo.id, { ...todo, children: [] });
  });

  // Second pass: build tree structure
  todos.forEach(todo => {
    const todoWithChildren = todoMap.get(todo.id)!;
    if (todo.parentId) {
      const parent = todoMap.get(todo.parentId);
      if (parent) {
        parent.children!.push(todoWithChildren);
      }
    } else {
      rootTodos.push(todoWithChildren);
    }
  });

  return rootTodos;
};

// Helper function to flatten tree back to array for storage
const flattenTodoTree = (todos: Todo[]): Todo[] => {
  const result: Todo[] = [];
  
  const flatten = (todoList: Todo[], parentId?: number) => {
    todoList.forEach(todo => {
      const { children, ...todoWithoutChildren } = todo;
      result.push({ ...todoWithoutChildren, parentId });
      if (children && children.length > 0) {
        flatten(children, todo.id);
      }
    });
  };
  
  flatten(todos);
  return result;
};

// Helper function to find todo by ID in tree
const findTodoById = (todos: Todo[], id: number): Todo | null => {
  for (const todo of todos) {
    if (todo.id === id) return todo;
    if (todo.children) {
      const found = findTodoById(todo.children, id);
      if (found) return found;
    }
  }
  return null;
};

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [statusMessage, setStatusMessage] = useState('');
  const [expandedTodos, setExpandedTodos] = useState<Set<number>>(new Set());

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
        const todoTree = buildTodoTree(parsedTodos);
        setTodos(todoTree);
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
        const flattenedTodos = flattenTodoTree(todos);
        localStorage.setItem('todos', JSON.stringify(flattenedTodos));
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

  const addSubTodo = (parentId: number, subTodoText: string) => {
    if (subTodoText.trim()) {
      const subTodo: Todo = {
        id: Date.now(),
        text: subTodoText.trim(),
        completed: false,
        createdAt: new Date(),
        parentId: parentId
      };
      
      const addSubTodoToTree = (todoList: Todo[]): Todo[] => {
        return todoList.map(todo => {
          if (todo.id === parentId) {
            return {
              ...todo,
              children: [...(todo.children || []), subTodo]
            };
          } else if (todo.children) {
            return {
              ...todo,
              children: addSubTodoToTree(todo.children)
            };
          }
          return todo;
        });
      };
      
      setTodos(addSubTodoToTree(todos));
    }
  };

  const toggleTodo = (id: number) => {
    const updateTodoInTree = (todoList: Todo[]): Todo[] => {
      return todoList.map(todo => {
        if (todo.id === id) {
          return { ...todo, completed: !todo.completed };
        } else if (todo.children) {
          return {
            ...todo,
            children: updateTodoInTree(todo.children)
          };
        }
        return todo;
      });
    };
    
    setTodos(updateTodoInTree(todos));
  };

  const deleteTodo = (id: number) => {
    const removeTodoFromTree = (todoList: Todo[]): Todo[] => {
      return todoList.filter(todo => {
        if (todo.id === id) {
          return false;
        } else if (todo.children) {
          todo.children = removeTodoFromTree(todo.children);
        }
        return true;
      });
    };
    
    setTodos(removeTodoFromTree(todos));
  };

  const clearCompleted = () => {
    const removeCompletedFromTree = (todoList: Todo[]): Todo[] => {
      return todoList.filter(todo => {
        if (todo.completed) {
          return false;
        } else if (todo.children) {
          todo.children = removeCompletedFromTree(todo.children);
        }
        return true;
      });
    };
    
    setTodos(removeCompletedFromTree(todos));
  };

  const toggleExpanded = (id: number) => {
    setExpandedTodos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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

  // Helper function to count todos recursively
  const countTodosRecursively = (todoList: Todo[], condition: (todo: Todo) => boolean): number => {
    let count = 0;
    todoList.forEach(todo => {
      if (condition(todo)) count++;
      if (todo.children) {
        count += countTodosRecursively(todo.children, condition);
      }
    });
    return count;
  };

  const activeTodosCount = countTodosRecursively(todos, todo => !todo.completed);
  const completedTodosCount = countTodosRecursively(todos, todo => todo.completed);

  // Recursive component to render nested todos
  const TodoItem = ({ todo, depth = 0 }: { todo: Todo; depth?: number }) => {
    const [showSubTodoInput, setShowSubTodoInput] = useState(false);
    const [subTodoText, setSubTodoText] = useState('');
    const hasChildren = todo.children && todo.children.length > 0;

    const handleAddSubTodo = (e: React.FormEvent) => {
      e.preventDefault();
      addSubTodo(todo.id, subTodoText);
      setSubTodoText('');
      setShowSubTodoInput(false);
    };

    return (
      <div className="todo-item-container">
        <div 
          className={`todo-item ${todo.completed ? 'completed' : ''}`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          {/* Removed expand/collapse button */}
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
            className="todo-checkbox"
          />
          <span className="todo-text">{todo.text}</span>
          <div className="todo-actions">
            <button
              onClick={() => setShowSubTodoInput(!showSubTodoInput)}
              className="add-sub-button"
              title="Add subtask"
            >
              +
            </button>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="delete-button"
            >
              ×
            </button>
          </div>
        </div>
        {/* Add subtodo input */}
        {showSubTodoInput && (
          <form onSubmit={handleAddSubTodo} className="add-subtodo-form">
            <input
              type="text"
              value={subTodoText}
              onChange={(e) => setSubTodoText(e.target.value)}
              placeholder="Add subtask..."
              className="subtodo-input"
              style={{ marginLeft: `${(depth + 1) * 20}px` }}
            />
            <button type="submit" className="add-subtodo-button">
              Add
            </button>
          </form>
        )}
        {/* Always render children if present */}
        {hasChildren && (
          <div className="todo-children">
            {todo.children!.map(child => (
              <TodoItem key={child.id} todo={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

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
            <TodoItem key={todo.id} todo={todo} />
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
