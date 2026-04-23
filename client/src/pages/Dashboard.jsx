import "../styles/dashboard.css";

function Dashboard() {
  return (
    <div className="dashboard">
      <h1 className="title">Dashboard</h1>

      <div className="cards">
        <div className="card">
          <p className="label">Total Notes</p>
          <h2>12</h2>
        </div>

        <div className="card">
          <p className="label">Quizzes</p>
          <h2>5</h2>
        </div>

        <div className="card">
          <p className="label">Progress</p>
          <h2>80%</h2>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;