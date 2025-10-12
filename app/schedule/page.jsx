export const metadata = {
    title: 'Schedule'
};

export default async function Page() {
    return (
        <div className="schedule-page">
            <h1 className="page-title">Schedule</h1>

            <div className="schedule-table-wrapper">
                <table className="schedule-table">
                    <thead>
                    <tr>
                        <th>Start</th>
                        <th>End</th>
                        <th colSpan="2">Friday</th>
                        <th colSpan="2">Saturday</th>
                        <th colSpan="2">Sunday</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>10:00</td>
                        <td>11:00</td>
                        <td rowSpan="9" colSpan="2" className="event-cell event-aufbau">Aufbau</td>
                        <td rowSpan="2" className="event-cell event-workshop">Switch Taster</td>
                        <td rowSpan="2" className="event-cell event-social">Café Crawl<br />(mit talk)</td>
                        <td rowSpan="2" className="event-cell event-brunch">Drag Brunch</td>
                        <td rowSpan="2" className="event-cell"></td>
                    </tr>
                    <tr>
                        <td>11:00</td>
                        <td>12:00</td>
                    </tr>
                    <tr>
                        <td>12:00</td>
                        <td>13:00</td>
                        <td rowSpan="2" className="event-cell event-workshop">Drag Workshop</td>
                        <td rowSpan="2" className="event-cell event-tour">Switch Masterclass</td>
                        <td rowSpan="2" className="event-cell event-tour">ZH Tour<br />(Queer)</td>
                        <td rowSpan="5" className="event-cell event-quiet">(maybe quiet zone somewhere)</td>
                    </tr>
                    <tr>
                        <td>13:00</td>
                        <td>14:00</td>
                    </tr>
                    <tr>
                        <td>14:00</td>
                        <td>15:00</td>
                        <td rowSpan="4" className="event-cell event-pride">Pride</td>
                        <td rowSpan="2" className="event-cell event-tour">ZH Tour<br />(Queer)</td>
                        <td rowSpan="3" className="event-cell event-tour">ZH Tour<br />(Swing Scene) (with dancing
                            stops?)
                        </td>
                    </tr>
                    <tr>
                        <td>15:00</td>
                        <td>16:00</td>
                    </tr>
                    <tr>
                        <td>16:00</td>
                        <td>17:00</td>
                        <td rowSpan="2" className="event-cell event-quiet">(maybe quiet zone at Regenbogenhaus)</td>
                    </tr>
                    <tr>
                        <td>17:00</td>
                        <td>18:00</td>
                        <td rowSpan="5" colSpan="2" className="event-cell event-party">Party<br />(Topic 3)</td>
                    </tr>
                    <tr>
                        <td>18:00</td>
                        <td>19:00</td>
                        <td rowSpan="2" colSpan="2" className="event-cell event-swimming">SWIMMING</td>
                    </tr>
                    <tr>
                        <td>19:00</td>
                        <td>20:00</td>
                        <td colSpan="2" className="event-cell event-checkin">Check-In</td>
                    </tr>
                    <tr>
                        <td>20:00</td>
                        <td>21:00</td>
                        <td className="event-cell event-crash">Crash-Kurs for non-dancers</td>
                        <td className="event-cell event-workshop">Choreo Workshop</td>
                        <td colSpan="2" className="event-cell event-social">something fun :)</td>
                    </tr>
                    <tr>
                        <td>21:00</td>
                        <td>22:00</td>
                        <td rowSpan="3" colSpan="2" className="event-cell event-party">Party<br />(Topic 1)</td>
                        <td rowSpan="3" colSpan="2" className="event-cell event-party">Party<br />(Topic 2)</td>
                    </tr>
                    <tr>
                        <td>22:00</td>
                        <td>23:00</td>
                        <td rowSpan="2" colSpan="2" className="event-cell event-afterparty">Afterparty<br />(Ask a Queer
                            for hosting on Sunday evening)
                        </td>
                    </tr>
                    <tr>
                        <td>23:00</td>
                        <td>00:00</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
