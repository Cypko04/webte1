const SEMESTER_START = new Date(2026, 8, 1);
const SEMESTER_END = new Date(2027, 1, 14, 23, 59);

const TEACHING_START = new Date(2026, 8, 14);
const TEACHING_END = new Date(2026, 11, 20, 23, 59);

/* MOBILE MENU */

const menuButton = document.getElementById("menu-button");
const navigation = document.getElementById("main-navigation");

if (menuButton && navigation) {
  document.documentElement.classList.add("js-enabled");

  menuButton.addEventListener("click", function () {
    const open = navigation.classList.toggle("is-open");

    menuButton.setAttribute("aria-expanded", open);
    menuButton.textContent = open ? "Zavrieť menu" : "Menu";
  });
}

/* SCHEDULE */

const lessons = document.querySelectorAll(".lesson");
const filterButtons = document.querySelectorAll(".filter-button");

function timeToMinutes(time) {
  const parts = time.split(":");

  return Number(parts[0]) * 60 + Number(parts[1]);
}

/* FILTERS */

if (lessons.length > 0) {
  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const filter = button.dataset.filter;
      let visible = 0;

      filterButtons.forEach(function (item) {
        item.classList.remove("active");
        item.setAttribute("aria-pressed", "false");
      });

      button.classList.add("active");
      button.setAttribute("aria-pressed", "true");

      lessons.forEach(function (lesson) {
        const show = filter === "all" || lesson.dataset.type === filter;

        lesson.style.visibility = show ? "visible" : "hidden";

        if (show) {
          visible++;
        }
      });

      const message = document.getElementById("filter-message");
      const table = document.querySelector(".schedule-table-wrapper");

      if (message && table) {
        message.hidden = visible !== 0;
        table.hidden = visible === 0;
      }
    });
  });
}

/* CURRENT / NEXT LESSON */

function showCurrentLesson() {
  const clock = document.getElementById("current-clock");
  const status = document.getElementById("current-lesson");

  if (!clock || !status || lessons.length === 0) {
    return;
  }

  const now = new Date();

  clock.textContent = now.toLocaleString("sk-SK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  lessons.forEach(function (lesson) {
    lesson.classList.remove("current");
  });

  if (now < TEACHING_START) {
    status.textContent = "Výučba ešte nezačala.";
    return;
  }

  if (now > TEACHING_END) {
    status.textContent = "Pravidelná výučba v tomto semestri sa už skončila.";
    return;
  }

  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const currentLessons = [];

  lessons.forEach(function (lesson) {
    const day = Number(lesson.dataset.day);
    const start = timeToMinutes(lesson.dataset.start);
    const end = timeToMinutes(lesson.dataset.end);

    if (day === currentDay && currentTime >= start && currentTime < end) {
      lesson.classList.add("current");
      currentLessons.push(lesson);
    }
  });

  if (currentLessons.length > 0) {
    const names = [];

    currentLessons.forEach(function (lesson) {
      names.push(lesson.dataset.name);
    });

    status.textContent = "Práve mám: " + names.join(" / ") + ".";

    return;
  }

  const next = findNextLesson(now);

  if (next) {
    const date = next.date.toLocaleDateString("sk-SK", {
      weekday: "long",
      day: "numeric",
      month: "numeric",
    });

    status.textContent =
      "Teraz nemám vyučovanie. Najbližšie mám " +
      next.lesson.dataset.name +
      " – " +
      date +
      " o " +
      next.lesson.dataset.start +
      ".";
  } else {
    status.textContent = "Teraz nemám vyučovanie.";
  }
}

function findNextLesson(now) {
  let next = null;

  lessons.forEach(function (lesson) {
    const lessonDay = Number(lesson.dataset.day);
    const start = timeToMinutes(lesson.dataset.start);

    const date = new Date(now);

    let daysAhead = lessonDay - now.getDay();

    if (daysAhead < 0) {
      daysAhead += 7;
    }

    date.setDate(now.getDate() + daysAhead);

    date.setHours(Math.floor(start / 60), start % 60, 0, 0);

    if (date <= now) {
      date.setDate(date.getDate() + 7);
    }

    if (date > TEACHING_END) {
      return;
    }

    if (!next || date < next.date) {
      next = {
        lesson: lesson,
        date: date,
      };
    }
  });

  return next;
}

showCurrentLesson();

if (lessons.length > 0) {
  setInterval(showCurrentLesson, 30000);
}

/* SEMESTER PROGRESS */

const progress = document.getElementById("semester-progress");
const progressText = document.getElementById("progress-text");

if (progress && progressText) {
  const now = new Date();

  let percent =
    ((now - SEMESTER_START) / (SEMESTER_END - SEMESTER_START)) * 100;

  percent = Math.max(0, Math.min(100, percent));

  progress.value = percent;

  progressText.textContent = "Uplynulo " + Math.round(percent) + " % semestra.";
}

/* MAP */

const mapElement = document.getElementById("map");

if (mapElement) {
  const mapHelp = document.getElementById("map-help");

  if (typeof L === "undefined") {
    mapElement.textContent = "Mapa sa nepodarila načítať.";

    if (mapHelp) {
      mapHelp.textContent = "Knižnica Leaflet sa nenačítala.";
    }
  } else {
    const school = {
      name: "FEI STU",
      lat: 48.1518,
      lng: 17.0732,
    };

    const home = {
      name: "Domov",
      lat: 48.9598,
      lng: 18.1663,
    };

    const map = L.map("map").setView([48.55, 17.62], 8);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    }).addTo(map);

    L.marker([school.lat, school.lng])
      .addTo(map)
      .bindPopup("<strong>FEI STU</strong><br>Bratislava");

    L.marker([home.lat, home.lng])
      .addTo(map)
      .bindPopup("<strong>Domov</strong><br>Približná poloha");

    const pointForm = document.getElementById("point-form");

    const pointName = document.getElementById("point-name");

    const pointList = document.getElementById("point-list");

    const emptyPoints = document.getElementById("empty-points");

    const destination = document.getElementById("destination");

    const distanceResult = document.getElementById("distance-result");

    let points = [];

    try {
      points = JSON.parse(localStorage.getItem("mapPoints") || "[]");
    } catch {
      points = [];
    }

    let markers = [];
    let newPoint = null;
    let newMarker = null;

    let selectedPoint = null;
    let distanceLine = null;

    function savePoints() {
      localStorage.setItem("mapPoints", JSON.stringify(points));
    }

    function showPoints() {
      pointList.innerHTML = "";

      markers.forEach(function (marker) {
        map.removeLayer(marker);
      });

      markers = [];

      emptyPoints.hidden = points.length > 0;

      points.forEach(function (point, index) {
        const marker = L.marker([point.lat, point.lng])
          .addTo(map)
          .bindPopup(point.name);

        markers.push(marker);

        const item = document.createElement("li");

        const button = document.createElement("button");

        button.type = "button";
        button.className = "point-button";
        button.textContent = point.name;

        if (selectedPoint === index) {
          button.classList.add("selected");
        }

        button.addEventListener("click", function () {
          selectedPoint = index;

          map.setView([point.lat, point.lng], 13);

          showPoints();
          showDistance();
        });

        item.appendChild(button);
        pointList.appendChild(item);
      });
    }

    map.on("click", function (event) {
      newPoint = {
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      };

      if (newMarker) {
        map.removeLayer(newMarker);
      }

      newMarker = L.marker([newPoint.lat, newPoint.lng])
        .addTo(map)
        .bindPopup("Nové miesto")
        .openPopup();

      mapHelp.textContent = "Miesto je vybrané. Teraz mu zadaj názov.";

      pointName.focus();
    });

    pointForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!newPoint) {
        mapHelp.textContent = "Najskôr klikni na miesto na mape.";

        return;
      }

      const name = pointName.value.trim();

      if (name === "") {
        return;
      }

      points.push({
        name: name,
        lat: newPoint.lat,
        lng: newPoint.lng,
      });

      savePoints();

      pointName.value = "";
      newPoint = null;

      if (newMarker) {
        map.removeLayer(newMarker);
        newMarker = null;
      }

      mapHelp.textContent = "Bod bol pridaný.";

      showPoints();
    });

    function toRadians(degrees) {
      return (degrees * Math.PI) / 180;
    }

    function calculateDistance(lat1, lng1, lat2, lng2) {
      const earthRadius = 6371;

      const latDifference = toRadians(lat2 - lat1);

      const lngDifference = toRadians(lng2 - lng1);

      const a =
        Math.sin(latDifference / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
          Math.cos(toRadians(lat2)) *
          Math.sin(lngDifference / 2) ** 2;

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return earthRadius * c;
    }

    function showDistance() {
      if (selectedPoint === null) {
        distanceResult.textContent = "Vyber jeden z vlastných bodov.";

        return;
      }

      const point = points[selectedPoint];

      const target = destination.value === "school" ? school : home;

      const distance = calculateDistance(
        point.lat,
        point.lng,
        target.lat,
        target.lng,
      );

      distanceResult.textContent =
        "Vzdušná vzdialenosť medzi " +
        point.name +
        " a " +
        target.name +
        " je približne " +
        distance.toFixed(1) +
        " km.";

      if (distanceLine) {
        map.removeLayer(distanceLine);
      }

      distanceLine = L.polyline([
        [point.lat, point.lng],
        [target.lat, target.lng],
      ]).addTo(map);

      map.fitBounds(distanceLine.getBounds(), {
        padding: [30, 30],
      });

      markers[selectedPoint]
        .bindPopup(
          "<strong>" +
            point.name +
            "</strong><br>" +
            distance.toFixed(1) +
            " km od " +
            target.name,
        )
        .openPopup();
    }

    destination.addEventListener("change", showDistance);

    showPoints();

    setTimeout(function () {
      map.invalidateSize();
    }, 100);
  }
}
