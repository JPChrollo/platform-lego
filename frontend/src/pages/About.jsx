function About() {
  return (
    <div>
      <h2>About Page</h2>
      <div className="card">
        <h3>About This Application</h3>
        <p>
          This is a full-stack application built with Next.js and Express.js. The primary aim of this project is providing a visual learning tool for early talent, as well as being a self-service platform for the provisioning of cloud resources.
        </p>
        <p>
          This project addresses the critical need to upskill early talent within Deloitte and to streamline the cloud infrastructure deployment process in response to rapid evolution within cloud technology. Specifically, it aims to unlock the power of using visual tools to create complex cloud solutions.
        </p>
      </div>

      <div className="card">
        <h3>Project Challenges</h3>
        <p>
          Within the technology industry, a significant challenge that arises is upskilling engineers to be able to deliver more robust software systems. This is further exacerbated by the need for engineers to consistently develop their knowledge in new technology stacks as more tools and technologies are introduced into the development ecosystem.
        </p>
        <p>
          Consequently, engineers are left in a never-ending cycle of learning these new tools and technologies preventing them from focusing on delivering the best software solutions.
        </p>
      </div>
      
      <div className="card">
        <h3>Core Problem Addressed</h3>
        <p>
          The core problem addressed by this project is to upskill early talent within cloud infrastructure deployment and to streamline the cloud infrastructure deployment process. This project also addresses the lack of conjunction that the cloud/DevOps can find in the Design and Implementation areas of the software development lifecycle.
        </p>
        <p>
          Although these areas are separately defined in the lifecycle for a multitude of reasons, when it comes to doing the work, much time can be saved by joining these processes together. By exploring this, many inefficiencies in the cloud deployment process may be solved, resulting in work being delivered with less resources and in less time.
        </p>
      </div>
      
      <div className="card">
        <h3>Architecture</h3>
        <p>
          The application follows a standard client-server architecture where:
        </p>
        <ul style={{ marginLeft: '2rem', marginTop: '1rem' }}>
          <li>Frontend runs on port 3000 and handles the user interface</li>
          <li>Backend runs on port 5000 and provides API endpoints</li>
          <li>API requests from frontend to backend use a Vite proxy for development</li>
        </ul>
      </div>
    </div>
  );
}

export default About;
