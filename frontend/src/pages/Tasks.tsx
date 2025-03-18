import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { getTasks } from "../api/task";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const fetchTasks = async () => {
      if (token) {
        const data = await getTasks(token);
        setTasks(data);
      }
    };
    fetchTasks();
  }, [token]);

  return (
    <div>
      <h2>Lista de Tareas</h2>
      <ul>
        {tasks.map((task: any) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default Tasks;