window.onload = function () {
  console.clear();

  // safarIE
  if (!('animate' in Element.prototype)) {
    Element.prototype.animate = () => {};
  }

  const dayEls = Array.from(document.querySelectorAll(".ui-day"));
  const trashEl = document.querySelector(".ui-trash");
  const rect = el => el.getBoundingClientRect();
  const trashRect = rect(trashEl);
  const center = el => {
    const elRect = rect(el);
    return [elRect.left + elRect.width / 2, elRect.top + elRect.height / 2];
  };
  const styleVars = (vars, el = document.documentElement) => {
    Object.keys(vars).forEach(key => {
      el.style.setProperty(`--${key}`, vars[key]);
    });
  };

  styleVars({
    "trash-x": trashRect.left,
    "trash-y": trashRect.top
  });

  // pretend it's redux, okay?
  const extState = {
    selected: [],
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    drag: {
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0
    },
    grabIndex: undefined,
    stretch: {},
    centers: dayEls.map(center)
  };

  const startSelection = (s, e) => ({
    x1: event.clientX,
    y1: event.clientY,
    x2: event.clientX,
    y2: event.clientY,
    selected: []
  });

  const updateSelection = (s, e) => {
    const mx1 = Math.min(s.x1, e.clientX);
    const mx2 = Math.max(s.x1, e.clientX);
    const my1 = Math.min(s.y1, e.clientY);
    const my2 = Math.max(s.y1, e.clientY);

    return {
      mx1,
      mx2,
      my1,
      my2,
      x2: e.clientX,
      y2: e.clientY,
      selected: extState.centers
        .map((center, i) => ({
          center,
          i
        }))
        .filter(({
          center: [x, y],
          i
        }) => {
          return x > mx1 && x < mx2 && y > my1 && y < my2;
        })
        .map(({
          i
        }) => i)
    };
  };

  const startDrag = (s, e) => ({
    drag: {
      type: e.type,
      index: e.index,
      x1: e.clientX,
      y1: e.clientY,
      x2: e.clientX,
      y2: e.clientY
    }
  });

  const drag = (s, e) => ({
    drag: {
      ...extState.drag,
      x2: e.clientX,
      y2: e.clientY
    }
  });

  const isNotTrashElement = (s, e) => e.target !== trashEl;
  const initGrab = (s, e) => ({
    grabIndex: e.index,
    stretchIndex: e.index
  });
  const updateGrab = (s, e) => {
    const {
      clientX
    } = e;
    const stretchIndexes = s.centers
      .map((c, i) => ({
        c,
        index: i
      }))
      .filter(({
        c: [x]
      }, i) => {
        return (
          s.selected.includes(i) &&
          ((s.grabIndex < i && clientX > x) ||
            (s.grabIndex > i && clientX < x)) &&
          Object.keys(s.stretch).every(key => {
            if (+key === +s.grabIndex) return true;

            const [min, max] = s.stretch[key];
            return key < s.grabIndex ? i > max : i < min;
          })
        );
      })
      .map(stretch => stretch.index);

    const start = Math.min(s.grabIndex, ...stretchIndexes);
    const end = Math.max(s.grabIndex, ...stretchIndexes);

    const prevRange = s.stretch[s.grabIndex];

    if (prevRange && prevRange[0] === start && prevRange[1] === end) {
      return;
    }

    flippingStyleVars({
        start: start + 1,
        end: end + 2
      },
      dayEls[s.grabIndex]
    );

    return {
      stretch: {
        ...s.stretch,
        [s.grabIndex]: [start, end]
      }
    };
  };
  const showDaysRemoved = (s, e) => {
    const {
      selected
    } = s;
    const numDays = selected.length;

    document.querySelector('.ui-alert-days').innerHTML = numDays;
  }

  const resetGrab = () => ({
    grabIndex: undefined
  });

  const machine = xstate.Machine({
    initial: "start",
    states: {
      start: {
        on: {
          mousedown: {
            selecting: {
              actions: [startSelection]
            }
          }
        }
      },
      selecting: {
        on: {
          mouseup: "selected",
          mousemove: {
            selecting: {
              actions: [updateSelection]
            }
          }
        }
      },
      selected: {
        on: {
          mousedown: {
            selecting: {
              actions: [startSelection]
            }
          },
          drag: {
            dragging: {
              actions: [startDrag]
            }
          }
        }
      },
      dragging: {
        on: {
          mousemove: {
            dragging: {
              actions: [drag]
            }
          },
          mouseup: [{
              target: "selected",
              cond: isNotTrashElement
            },
            {
              target: "disposed",
              actions: [showDaysRemoved]
            }
          ]
        }
      },
      disposed: {
        on: {
          startGrab: {
            grabbing: {
              actions: [initGrab]
            }
          }
        }
      },
      grabbing: {
        on: {
          mousemove: {
            grabbing: {
              actions: [updateGrab]
            }
          },
          mouseup: {
            disposed: {
              actions: [resetGrab]
            }
          }
        }
      }
    }
  });

  let currentState = machine.initialState;

  const flipping = new Flipping({
    activeSelector: el => el.matches('[data-state="grabbed"] *')
  });

  const flippingStyleVars = flipping.wrap(styleVars);

  const send = event => {
    const state = machine.transition(currentState, event, extState);

    if (state.value !== currentState.value) {
      document.body.setAttribute("data-prev-state", currentState.value);
    }

    currentState = state;

    if (state.actions) {
      state.actions.reduce((extState, action) => {
        Object.assign(extState, action(extState, event) || {});
        return extState;
      }, extState);
    }

    document.body.setAttribute("data-state", currentState.value);
    const {
      mx1,
      my1,
      mx2,
      my2,
      drag,
      grabIndex,
      stretchIndex
    } = extState;

    styleVars({
      mx1,
      my1,
      mx2,
      my2,
      "drag-index": drag.index,
      "drag-x1": drag.x1,
      "drag-y1": drag.y1,
      "drag-x2": drag.x2,
      "drag-y2": drag.y2
    });

    dayEls.forEach((el, i) =>
      el.setAttribute(
        "data-state",
        extState.selected.includes(i) ? "selected" : ""
      )
    );

    if (extState.grabIndex !== undefined) {
      dayEls[extState.grabIndex].setAttribute("data-state", "grabbed");
    }
  };

  document.body.setAttribute("data-state", machine.initial);

  document.body.addEventListener("mousedown", e => {
    send(e);
  });

  document.body.addEventListener("mouseup", e => {
    send(e);
  });

  document.body.addEventListener("mousemove", e => {
    send(e);
  });

  dayEls.forEach((el, i) => {
    styleVars({
      yc: Math.abs(3 - i)
    }, el);
    el.addEventListener("mousedown", e => {
      if (e.target.matches('[data-state="selected"]')) {
        send({
          type: "drag",
          index: i,
          clientX: e.clientX,
          clientY: e.clientY
        });
      }
    });

    el.addEventListener("mouseover", e => {
      send({
        type: "mouseover",
        index: i
      });
    });

    Array.from(el.querySelectorAll(".ui-grab")).forEach(grabEl => {
      grabEl.addEventListener("mousedown", e => {
        send({
          type: "startGrab",
          index: i
        });
      });
    });
  });

  trashEl.addEventListener("mouseover", e => {
    send({
      type: "prepareDispose"
    });
  });
  trashEl.addEventListener("mouseup", e => {
    send("dispose");
  });
  trashEl.addEventListener("mouseout", e => {
    send("cancelDispose");
  });

  // because someone will inevitably resize their screen
  window.addEventListener('resize', e => {
    extState.centers = dayEls.map(center);
  });

}