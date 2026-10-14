
(() => {
  "use strict";

  const STORAGE_KEY = "mi-entrenamiento-marks-v1";

  const monthLabel = document.getElementById("month-label");
  const calendar = document.getElementById("calendar");
  const countLabel = document.getElementById("count");
  const prevButton = document.getElementById("prev-month");
  const nextButton = document.getElementById("next-month");

  const today = new Date();

  let visibleYear = today.getFullYear();
  let visibleMonth = today.getMonth();
  let marks = loadMarks();

  // Identificador del mes: YYYY-MM
  function monthKey(year, month) {
    return `${year}-${String(month + 1).padStart(2, "0")}`;
  }

  // Recuperar las marcas guardadas en este navegador.
  function loadMarks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(saved || "{}");

      return parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
        ? parsed
        : {};
    } catch (error) {
      return {};
    }
  }

  // Guardar las marcas localmente, sin utilizar Notion.
  function saveMarks() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(marks)
      );
    } catch (error) {
      console.warn(
        "No se pudieron guardar las marcas en este navegador."
      );
    }
  }

  // Eliminar las marcas de meses anteriores.
  function cleanOldMonths() {
    const currentKey = monthKey(
      today.getFullYear(),
      today.getMonth()
    );

    Object.keys(marks).forEach((key) => {
      if (key !== currentKey) {
        delete marks[key];
      }
    });

    saveMarks();
  }

  // Cantidad de días del mes.
  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  // La semana comienza el lunes.
  function mondayFirstOffset(year, month) {
    return (new Date(year, month, 1).getDay() + 6) % 7;
  }

  // Dibujar el calendario.
  function renderCalendar() {
    const key = monthKey(visibleYear, visibleMonth);

    const totalDays = daysInMonth(
      visibleYear,
      visibleMonth
    );

    const isCurrentMonth =
      visibleYear === today.getFullYear() &&
      visibleMonth === today.getMonth();

    const monthMarks =
      isCurrentMonth && Array.isArray(marks[key])
        ? marks[key]
        : [];

    const monthDate = new Date(
      visibleYear,
      visibleMonth,
      1
    );

    monthLabel.textContent = monthDate.toLocaleDateString(
      "es-EC",
      {
        month: "long",
        year: "numeric"
      }
    );

    countLabel.textContent =
      `${monthMarks.length} / ${totalDays}`;

    calendar.replaceChildren();

    const offset = mondayFirstOffset(
      visibleYear,
      visibleMonth
    );

    const totalCells =
      Math.ceil((offset + totalDays) / 7) * 7;

    const previousMonthDays = daysInMonth(
      visibleYear,
      visibleMonth - 1
    );

    for (let cell = 0; cell < totalCells; cell++) {
      let dayNumber;
      let outsideMonth = false;

      if (cell < offset) {
        // Días del mes anterior, solo decorativos.
        dayNumber =
          previousMonthDays - offset + cell + 1;

        outsideMonth = true;
      } else if (cell >= offset + totalDays) {
        // Días del mes siguiente, solo decorativos.
        dayNumber = cell - offset - totalDays + 1;

        outsideMonth = true;
      } else {
        dayNumber = cell - offset + 1;
      }

      const button = document.createElement("button");

      button.type = "button";
      button.className = "day";

      const number = document.createElement("span");
      number.className = "day-number";
      number.textContent = String(dayNumber);

      const check = document.createElement("span");
      check.className = "day-check";
      check.setAttribute("aria-hidden", "true");

      if (outsideMonth) {
        button.classList.add("outside");
        button.disabled = true;
        button.tabIndex = -1;
        button.setAttribute("aria-hidden", "true");
      } else {
        const trained = monthMarks.includes(dayNumber);

        const isToday =
          isCurrentMonth &&
          dayNumber === today.getDate();

        if (trained) {
          button.classList.add("done");
          check.textContent = "✓";
        }

        if (isToday) {
          button.classList.add("today");
        }

        button.setAttribute(
          "aria-pressed",
          String(trained)
        );

        button.setAttribute(
          "aria-label",
          `${dayNumber} de ${monthLabel.textContent}` +
          (trained ? ", entrené" : ", no marcado")
        );

        // Solo se pueden marcar días del mes actual.
        button.addEventListener("click", () => {
          if (!isCurrentMonth) return;

          const updated = new Set(
            Array.isArray(marks[key])
              ? marks[key]
              : []
          );

          if (updated.has(dayNumber)) {
            updated.delete(dayNumber);
          } else {
            updated.add(dayNumber);
          }

          marks[key] = Array.from(updated).sort(
            (a, b) => a - b
          );

          saveMarks();
          renderCalendar();
        });
      }

      button.append(number, check);
      calendar.appendChild(button);
    }
  }

  // Cambiar de mes con las flechas.
  function changeMonth(amount) {
    const nextDate = new Date(
      visibleYear,
      visibleMonth + amount,
      1
    );

    visibleYear = nextDate.getFullYear();
    visibleMonth = nextDate.getMonth();

    // Si volvemos al mes actual, comprobamos
    // si hay marcas antiguas que eliminar.
    if (
      visibleYear === today.getFullYear() &&
      visibleMonth === today.getMonth()
    ) {
      cleanOldMonths();
    }

    renderCalendar();
  }

  prevButton.addEventListener("click", () => {
    changeMonth(-1);
  });

  nextButton.addEventListener("click", () => {
    changeMonth(1);
  });

  // Inicializar el widget.
  cleanOldMonths();
  renderCalendar();
})();
