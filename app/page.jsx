export default function Page() {
    return (
        <article className="home-content">
            <div className="content-wrapper">
                <div className="acronym-display" aria-label="QSDEZ - Queer Swing Dance Exchange Zürich">
                    <div className="bubbles-container">
                        <div className="bubble bubble-q">
                            <span className="bubble-text">Q</span>
                        </div>
                        <span className="word-continuation word-queer">ueer</span>
                    </div>

                    <div className="bubbles-container">
                        <div className="bubble bubble-s">
                            <span className="bubble-text">S</span>
                        </div>
                        <span className="word-continuation word-swing">wing</span>
                    </div>

                    <div className="bubbles-container">
                        <div className="bubble bubble-d">
                            <span className="bubble-text">D</span>
                        </div>
                        <span className="word-continuation word-dance">ance</span>
                    </div>

                    <div className="bubbles-container">
                        <div className="bubble bubble-e">
                            <span className="bubble-text">E</span>
                        </div>
                        <span className="word-continuation word-exchange">xchange</span>
                    </div>

                    <div className="bubbles-container">
                        <div className="bubble bubble-z">
                            <span className="bubble-text">Z</span>
                        </div>
                        <span className="word-continuation word-zurich">ürich</span>
                    </div>
                </div>

                <section className="info-section">
                    <p className="date-text">
                        <time dateTime="2026-06-19/2026-06-21">June 19-21, 2026</time>
                    </p>
                    <p className="save-date">Save the Date</p>
                    <p className="more-info">More information coming soon</p>
                </section>
            </div>
        </article>
    );
}
