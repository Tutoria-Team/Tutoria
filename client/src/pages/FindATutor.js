import '../styles/pages.css';

const FindATutor = () => {
  return (
    <div>
      <div className="title-container">
        <h1 className="page-title">Find a Tutor!</h1>
      </div>

      <div className="page-layout">
        <div className="filter-container">
          <h2>Filters</h2>
          {/* Add your filter elements here */}
        </div>

        <div className="courses-container">
          <div className="course-card">
            <h4>Data Structures</h4>
            <div className="course-details">
              <div className="course-rating">
                <p>Overall Rating</p>
                <strong>4.5/5</strong>
                <small>10 Reviews</small>
              </div>
              <div className="course-price">
                <strong>$50/hr</strong>
              </div>
            </div>
          </div>
          {/* Mockup Course Card 2 */}
          <div className="course-card">
            <h4>Programming Languages</h4>
            <div className="course-details">
              <div className="course-rating">
                <p>Overall Rating</p>
                <strong>4.5/5</strong>
                <small>10 Reviews</small>
              </div>
              <div className="course-price">
                <strong>$50/hr</strong>
              </div>
            </div>
          </div>
          <div className="course-card">
            <h4>Database Systems</h4>
            <div className="course-details">
              <div className="course-rating">
                <p>Overall Rating</p>
                <strong>4.5/5</strong>
                <small>10 Reviews</small>
              </div>
              <div className="course-price">
                <strong>$50/hr</strong>
              </div>
            </div>
          </div>
          <div className="course-card">
            <h4>Data Mining</h4>
            <div className="course-details">
              <div className="course-rating">
                <p>Overall Rating</p>
                <strong>4.5/5</strong>
                <small>10 Reviews</small>
              </div>
              <div className="course-price">
                <strong>$50/hr</strong>
              </div>
            </div>
          </div>
          <div className="course-card">
            <h4>Computer Organization</h4>
            <div className="course-details">
              <div className="course-rating">
                <p>Overall Rating</p>
                <strong>4.5/5</strong>
                <small>10 Reviews</small>
              </div>
              <div className="course-price">
                <strong>$50/hr</strong>
              </div>
            </div>
          </div>
          <div className="course-card">
            <h4>Foundations of Computer Science</h4>
            <div className="course-details">
              <div className="course-rating">
                <p>Overall Rating</p>
                <strong>4.5/5</strong>
                <small>10 Reviews</small>
              </div>
              <div className="course-price">
                <strong>$50/hr</strong>
              </div>
            </div>
          </div>
          <div className="course-card">
            <h4>Computer Science I</h4>
            <div className="course-details">
              <div className="course-rating">
                <p>Overall Rating</p>
                <strong>4.5/5</strong>
                <small>10 Reviews</small>
              </div>
              <div className="course-price">
                <strong>$50/hr</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindATutor;
