import React, { useState } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import Navbar from "react-bootstrap/Navbar";
import Card from "react-bootstrap/Card";
import Modal from "react-bootstrap/Modal";
import InfoIcon from "@mui/icons-material/Info";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function App() {
  //declaration of required states
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState("");
  const [show, setShow] = useState(false);

  // handling opening & closing of model
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // formating date as per requirement
  const formatDate = (date) => {
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    if (month < 10) {
      month = `0${month}`;
    }

    if (day < 10) {
      day = `0${day}`;
    }

    return `${year}-${month}-${day}`;
  };

  // fetching data from api on button click
  const fetchData = async () => {
    // getting formated date
    const start = formatDate(startDate);
    const end = formatDate(endDate);

    // declaring constants for validation purpose
    const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const today = formatDate(new Date());

    // validating dates
    if (start === end) {
      setError("Start date and end date should not be the same");
      return;
    } else if (diffDays > 7) {
      setError("Date range should not be greater than 7 days");
      return;
    } else if (end > today) {
      setError("End date should not be greater than today");
      return;
    } else if (endDate.getTime() <= startDate.getTime()) {
      setError("End date should be greater than start date");
      return;
    }

    setLoading(true);
    setError("");


    try {
      // calling api
      const response = await axios.get(
        `https://api.nasa.gov/neo/rest/v1/feed?start_date=${start}&end_date=${end}&api_key=XCae61RcTawn0ec3bwICL2Ri02sCvpcResQ7hmT3`
      );

      // generating dates for labels for chart
      const dates = Object.keys(response.data.near_earth_objects)
        .map((date) => new Date(date))
        .sort((a, b) => a - b) // Sort dates in ascending order
        .map((date) => date.toISOString().split("T")[0]);

      const asteroidCount = [];
      let fastestAsteroid = {};
      let closestAsteroid = {};
      let avgSizeOfAsteroid = 0;
      // let totalAsteroids = 0;



      dates.forEach((date) => {

        // getting the count of asteroids on a date
        let count = response.data.near_earth_objects[date].length;
        asteroidCount.push(count);
        // totalAsteroids += count;

        // getting the fastest & closest asteroid  and avgsize data 
        response.data.near_earth_objects[date].forEach((asteroid) => {
          if (
            !fastestAsteroid.speed ||
            asteroid.close_approach_data[0].relative_velocity
              .kilometers_per_hour > fastestAsteroid.speed
          ) {
            fastestAsteroid = {
              name: asteroid.name,
              speed: parseFloat(
                asteroid.close_approach_data[0].relative_velocity
                  .kilometers_per_hour
              ).toFixed(2),
              date: date,
            };
          }

          if (
            !closestAsteroid.distance ||
            asteroid.close_approach_data[0].miss_distance.kilometers <
              closestAsteroid.distance
          ) {
            closestAsteroid = {
              name: asteroid.name,
              distance: parseFloat(
                asteroid.close_approach_data[0].miss_distance.kilometers
              ).toFixed(2),
              date: date,
            };
          }
          // avgSizeOfAsteroid +=
          //   asteroid.estimated_diameter.kilometers.estimated_diameter_max;
          avgSizeOfAsteroid +=
            asteroid.estimated_diameter.kilometers.estimated_diameter_max /
            count;
        });
      });

      // limitng the decimal
      avgSizeOfAsteroid = avgSizeOfAsteroid.toFixed(2);

      setStats({
        fastestAsteroid,
        closestAsteroid,
        avgSizeOfAsteroid,
      });

      setData({
        labels: dates,
        datasets: [
          {
            label: "Number of asteroids",
            data: asteroidCount,
            fill: false,
            borderColor: "rgb(255, 99, 132)",
            backgroundColor: "rgba(255, 99, 132, 0.5)",
          },
        ],
      });

    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  // options prop for chart component
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Chart.js Line Chart",
      },
    },
    maintainAspectRatio: false, // Disable the aspect ratio
    // height: 800, // Set the height of the chart
    // width: 800,
  };

  return (
    <>
      <Container fluid>
        {/* header with navbar */}
        <header>
          <Navbar bg="dark" variant="dark">
            <Container>
              <Navbar.Brand>
                <img
                  alt="ANS"
                  src={require("./assets/meteorite.png")}
                  width="32"
                  height="32"
                  className="d-inline-block align-top"
                />{" "}
                Asteroid - Neo Stats
              </Navbar.Brand>
            </Container>
          </Navbar>
        </header>

        {/* row for form */}
        <Row
          style={{
            margin: "auto",
            maxWidth: "80%",
          }}
        >
          <Col md="auto" style={{ margin: "auto" }}>
            <Form style={{ margin: 10 }}>
              <Form.Group
                as={Row}
                controlId="startDate"
                style={{ marginBottom: 5 }}
              >
                <Form.Label column sm={4}>
                  Start Date
                </Form.Label>
                <Col sm={8}>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    className="form-control"
                    dateFormat="yyyy-MM-dd"
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} controlId="endDate">
                <Form.Label column sm={4}>
                  End Date
                </Form.Label>
                <Col sm={8}>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    className="form-control"
                    dateFormat="yyyy-MM-dd"
                  />
                </Col>
              </Form.Group>

              <Button
                onClick={fetchData}
                disabled={loading}
                style={{ marginTop: 10 }}
              >
                {loading ? "Loading..." : "Submit"}
              </Button>
              <InfoIcon
                onClick={handleShow}
                style={{ margin: 5, cursor: "pointer" }}
              />

              {error && <p className="text-danger mt-3">{error}</p>}
            </Form>
          </Col>
        </Row>

        {/* showing table and stats only if data is available */}
        {Object.keys(data).length > 0 && (
          <>
            {/* row for showing chart */}
            <Row
              className="my-5"
              style={{
                margin: "auto",
                display: "flex",
                justifyContent: "center",
                maxWidth: "80%",
              }}
            >
              <Col
                style={{
                  display: "flex",
                  justifyContent: "center",
                  // maxHeight: "800px",
                  maxWidth: "800px",
                }}
              >
                <Line
                  options={options}
                  data={data}
                  style={{ height: 500, width: 800 }}
                />
              </Col>
            </Row>

            {/* row for showing stats */}
            <Row
              style={{
                margin: "auto",
                maxWidth: "80%",
                marginBottom: "30px",
              }}
            >
              <Col md="auto" style={{ margin: "auto", marginTop: 5 }}>
                <Card style={{ width: "18rem" }}>
                  <Card.Body>
                    <Card.Title>Fastest Asteroid</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                      {stats.fastestAsteroid.name}
                    </Card.Subtitle>
                    <Card.Text>
                      The max speed of the asteroid was{" "}
                      <b>{stats.fastestAsteroid.speed} km/h</b> on date{" "}
                      {stats.fastestAsteroid.date}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md="auto" style={{ margin: "auto", marginTop: 5 }}>
                <Card style={{ width: "18rem" }}>
                  <Card.Body>
                    <Card.Title>Closest Asteroid</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                      {stats.closestAsteroid.name}
                    </Card.Subtitle>
                    <Card.Text>
                      The distance of the asteroid at the closest time was{" "}
                      <b>{stats.closestAsteroid.distance} kms</b> on date{" "}
                      {stats.closestAsteroid.date}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md="auto" style={{ margin: "auto", marginTop: 5 }}>
                <Card style={{ width: "18rem" }}>
                  <Card.Body>
                    <Card.Title>Average Asteroid Size</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                      All the asteroids
                    </Card.Subtitle>
                    <Card.Text>
                      The average size of the asteroids is{" "}
                      <b>{stats.avgSizeOfAsteroid} kms</b> in the date range of{" "}
                      {formatDate(startDate)} to {formatDate(endDate)}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>

      {/* model for showing date constraints */}
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Date Constraints</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ol>
            <li>Start date and end date should be different</li>
            <li>
              Start date and end date difference should be less than 7 days
            </li>
            <li>Start date should be less than end date</li>
            <li>Etart date should not be greater than today</li>
          </ol>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default App;
