export default function Page() {
    return (
        <div className="flex flex-col gap-12 sm:gap-16">
            <section>
                <div className="content-wrapper">
                    <div className="bubbles-container">
                        <div className="bubble bubble-q">
                            <span className="bubble-text">Q</span>
                        </div>
                        <div className="word-continuation word-queer">ueer</div>

                        <div className="bubble bubble-s">
                            <span className="bubble-text">S</span>
                        </div>
                        <div className="word-continuation word-swing">wing</div>

                        <div className="bubble bubble-d">
                            <span className="bubble-text">D</span>
                        </div>
                        <div className="word-continuation word-dance">ance</div>

                        <div className="bubble bubble-e">
                            <span className="bubble-text">E</span>
                        </div>
                        <div className="word-continuation word-exchange">xchange</div>

                        <div className="bubble bubble-z">
                            <span className="bubble-text">Z</span>
                        </div>
                        <div className="word-continuation word-zurich">ürich</div>
                    </div>

                    <div className="info-section">
                        <div className="date-text">June 19-21, 2026</div>
                        <div className="save-date">Save the Date</div>
                        <div className="more-info">More information coming soon</div>
                    </div>
                </div>
            </section>
        </div>
    );
}
