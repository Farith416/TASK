import React, { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';

import backlogImg from './images/Backlog.svg';
import todoImg from './images/To-do.svg';
import inProgressImg from './images/in-progress.svg';
import doneImg from './images/Done.svg';
import cancelledImg from './images/Cancelled.svg';

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [grouping, setGrouping] = useState(localStorage.getItem('grouping') || 'status');
  const [ordering, setOrdering] = useState(localStorage.getItem('ordering') || 'priority');
  const [showDisplayOptions, setShowDisplayOptions] = useState(false);

  const columnIcons = {
    Backlog: backlogImg,
    Todo: todoImg,
    'In Progress': inProgressImg,
    Done: doneImg,
    Cancelled: cancelledImg,
  };

  const columnHeaders = ['Backlog', 'Todo', 'In Progress', 'Done', 'Cancelled'];

  const normalizeStatus = (status) => {
    switch (status.toLowerCase()) {
      case 'backlog':
        return 'Backlog';
      case 'todo':
        return 'Todo';
      case 'in progress':
        return 'In Progress';
      case 'done':
        return 'Done';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Backlog';
    }
  };

  useEffect(() => {
    axios
      .get('https://api.quicksell.co/v1/internal/frontend-assignment')
      .then((response) => {
        const { tickets, users } = response.data;
        const tasksWithUserNames = tickets.map((ticket) => {
          const user = users.find((user) => user.id === ticket.userId);
          return {
            ...ticket,
            user: user ? user.name : 'Unknown',
            status: normalizeStatus(ticket.status),
          };
        });
        setTasks(tasksWithUserNames);
      })
      .catch((error) => {
        console.error('Error fetching tasks:', error);
      });
  }, []);

  const groupTasksBy = (tasks) => {
    if (grouping === 'status') {
      const groups = {
        Backlog: [],
        Todo: [],
        'In Progress': [],
        Done: [],
        Cancelled: [],
      };
      tasks.forEach((task) => {
        if (groups[task.status]) {
          groups[task.status].push(task);
        }
      });
      return groups;
    } else if (grouping === 'user') {
      const groups = {};
      tasks.forEach((task) => {
        if (!groups[task.user]) {
          groups[task.user] = [];
        }
        groups[task.user].push(task);
      });
      return groups;
    } else if (grouping === 'priority') {
      const priorityGroups = {
        4: 'Urgent',
        3: 'High',
        2: 'Medium',
        1: 'Low',
        0: 'No Priority',
      };
      const groups = {
        Urgent: [],
        High: [],
        Medium: [],
        Low: [],
        'No Priority': [],
      };
      tasks.forEach((task) => {
        const priorityGroup = priorityGroups[task.priority];
        groups[priorityGroup].push(task);
      });
      return groups;
    }
  };

  const sortTasks = (tasks) => {
    if (ordering === 'priority') {
      return tasks.sort((a, b) => b.priority - a.priority);
    } else if (ordering === 'title') {
      return tasks.sort((a, b) => a.title.localeCompare(b.title));
    }
    return tasks;
  };

  useEffect(() => {
    localStorage.setItem('grouping', grouping);
    localStorage.setItem('ordering', ordering);
  }, [grouping, ordering]);

  const groupedTasks = groupTasksBy(tasks);

  const handleDisplayButtonClick = () => {
    setShowDisplayOptions(!showDisplayOptions);
  };

  return (
    <div className="kanban-board">
      <div className="display-wrapper">
        <button
          className="display-button"
          onClick={handleDisplayButtonClick}
        >
          Display
        </button>
        {showDisplayOptions && (
          <div className="controls-panel">
            <div className="control-group">
              <label htmlFor="grouping">Grouping:</label>
              <select
                id="grouping"
                value={grouping}
                onChange={(e) => setGrouping(e.target.value)}
              >
                <option value="status">Status</option>
                <option value="user">User</option>
                <option value="priority">Priority</option>
              </select>
            </div>

            <div className="control-group">
              <label htmlFor="ordering">Ordering:</label>
              <select
                id="ordering"
                value={ordering}
                onChange={(e) => setOrdering(e.target.value)}
              >
                <option value="priority">Priority</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Render Kanban Columns */}
      <div className="kanban-columns">
        {tasks.length === 0 ? (
          <p>No tasks to display</p>
        ) : (
          Object.keys(groupedTasks).map((group) => (
            <div key={group} className="kanban-column">
              <div className="column-header">
                {grouping === 'user' ? (
                  <>
                    <img
                      src={`https://ui-avatars.com/api/?name=${group}&background=random`}
                      alt={group}
                      className="user-avatar"
                    />
                    <h3 className="column-title">
                      <span className="column-name">{group}</span>
                      <span className="task-count">{groupedTasks[group].length}</span>
                    </h3>
                  </>
                ) : (
                  <>
                    {/* Display Status Image at the top of each group when grouping by status */}
                    {grouping === 'status' && (
                      <img
                        src={columnIcons[group]}
                        alt={group}
                        className="group-status-icon"
                      />
                    )}
                    <h3 className="column-title">
                      <span className="column-name">{group}</span>
                      <span className="task-count">{groupedTasks[group].length}</span>
                    </h3>
                  </>
                )}
                <div className="header-buttons">
                  <button className="add-task-button">+</button>
                  <button className="menu-button-top">...</button>
                </div>
              </div>

              {groupedTasks[group].length === 0 ? (
                <p className="no-tasks-message">No tasks to display</p>
              ) : (
                sortTasks(groupedTasks[group]).map((task) => (
                  <div key={task.id} className="kanban-card">
                    <div className="task-header">
                      {/* Status image for user or priority grouping */}
                      {(grouping === 'user' || grouping === 'priority') && (
                        <img
                          src={columnIcons[task.status]} // Use the status to fetch the appropriate icon
                          alt={task.status}
                          className="status-image"
                        />
                      )}
                      <h4 className="ticket-id">{task.id}</h4>

                      {/* Avatar in top-right corner for status grouping */}
                      {grouping === 'status' && (
                        <img
                          src={`https://ui-avatars.com/api/?name=${task.user}&background=random`}
                          alt={task.user}
                          className="user-avatar-status-grouping"
                        />
                      )}
                    </div>

                    <p>{task.title}</p>

                    {/* Include 3-dot menu, dark circle, and feature request */}
                    <div className="card-footer">
                      <div className="menu-box">
                        <button className="menu-button-bottom">...</button>
                        <div className="feature-tag-container">
                          <button className="dark-circle-button">•</button>
                          <button className="feature-tag">Feature Request</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default App;
