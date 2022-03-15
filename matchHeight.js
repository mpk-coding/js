//  scaling elements to match the height of the highest representant within a given group of elements
const matchHeight = (
  rootElement,
  resizeElements = [{
      classSelector: "",
      attribute: ""
  }]
) => {
  const root =
      typeof rootElement == "string" ?
      document.querySelector(rootElement) :
      rootElement;
  if (!root) {
      return;
  }
  //  execute the fn once when events are fired in quick succession, such as resizing the window manually with the handle
  function debounce(func, timeout = 300) {
      let timer;
      return (...args) => {
          clearTimeout(timer);
          timer = setTimeout(() => {
              func.apply(this, args);
          }, timeout);
      };
  }
  //  returns an set of unique data-label values for a given selector
  const getLabels = (selector, attribute = null) => {
      if (attribute == null) {
          return false;
      }
      attribute == `${attribute}`;
      const nodeList =
          typeof selector == "string" ?
          document.querySelectorAll(`${selector}[${attribute}]`) :
          selector;
      let datasetProperty = "";
      attribute.match(/data-/) ?
          attribute.split("data-").map((entry) => {
              if (entry != "data") {
                  return entry.split("-").map((word) => {
                      if (entry.split("-").indexOf(word) < 1) {
                          return (datasetProperty += word);
                      } else {
                          return (datasetProperty +=
                              word[0].toUpperCase() + word.slice(1));
                      }
                  });
              }
          }) :
          attribute;
      const uniqueLabels = new Set();
      Array.from(nodeList).map((element) => {
          return uniqueLabels.add(element.dataset[datasetProperty]);
      });
      return uniqueLabels != 0 ? uniqueLabels : false;
  };
  //  returns the highest value of the height property for a given selector
  const getHighestVal = (array) => {
      let highest = 0;
      Array.from(array).map((entry) => {
          highest =
              entry.getBoundingClientRect().height > highest ?
              entry.getBoundingClientRect().height :
              highest;
      });
      return highest;
  };
  //  sets the height property to the highest value for given selectors (array of arrays of selectors...)
  //  this is done so that only css selectors are needed to perform the functionality, so as to add or remove rows from the accordion__grid without having to modify the code base
  const setHeight = (elements) => {
      return elements.map((element) => {
          if (typeof element.classSelector == "string") {
              //  edge for when elements of same class differ between each other, distinguished by their labels
              // element returns an array, have to extract string value
              const labels = element.attribute ?
                  getLabels(
                      element.classSelector,
                      element.attribute ? element.attribute : null
                  ) :
                  element.classSelector;
              //  get a set of each unique label, and execute the same functionality, with individual values for each data-label attribute
              return Array.from(labels).map((uniqueLabel) => {
                  const dataSelector = element.attribute ?
                      `[${element.attribute}='${uniqueLabel}']` :
                      "";
                  const nodeList = document.querySelectorAll(
                      `${element.classSelector}${dataSelector}`
                  );
                  //  reset heights in a separate loop to ensure correct values read
                  Array.from(nodeList).map((element) => {
                      return (element.style.height = "initial");
                  });
                  //  adjust heights
                  return Array.from(nodeList).map((element) => {
                      return (element.style.height =
                          `${Math.floor(getHighestVal(nodeList))}px`);
                  });
              });
          } else {
              throw "classSelector must me a valid CSS selector";
          }
      });
  };
  const debouncedSetHeight = debounce(() => {
      return setHeight(resizeElements);
  }, 120);

  let vw = window.innerWidth;
  const isVwChange = () => {
      if (vw !== window.innerWidth) {
          vw = window.innerWidth;
          window.dispatchEvent(new CustomEvent("vw-change"));
      }
  };

  const debouncedIsVwChange = debounce(() => {
      return isVwChange();
  }, 250);

  //  resize observer to respond to viewport changes
  const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
          //debouncedIsVwChange();
          debouncedSetHeight(resizeElements);
      });
  });
  //  handler for custom event:
  //  dispatched from accordion() when it's supposed to open or close
  //  gets elements relevant to the event.target that are meant to be scaled
  //  helps with mobile optimisation
  //  could be restricted only to the currently viewed column (distinguished by .active class)
  window.addEventListener("vw-change", (event) => {
      return debouncedSetHeight(resizeElements);
  });

  window.addEventListener("accordion--toggle", (event) => {
      return setHeight([{
          classSelector: `.accordion.show[data-label='${event.detail.target.dataset.label}'] .accordion__content .accordion__cell`,
          attribute: "data-label",
      }, ]);
  });
  return observer.observe(root);
};

//  simple accordion dispatching a custom event
const accordions = () => {
  const root = document.querySelector(".accordion__grid");
  const accordions = document.querySelectorAll(".accordion[data-label]");

  root.addEventListener("click", (event) => {
      let show = Array.from(accordions).find((element) => {
          return event.target === element.querySelector(".accordion__title");
      });
      //
      if (!show) {
          return;
      }
      //
      show = show.dataset.label;
      //
      Array.from(document.querySelectorAll(`[data-label='${show}']`)).map(
          (element) => {
              return element.classList.toggle("show");
          }
      );
      return window.dispatchEvent(
          new CustomEvent("accordion--toggle", {
              detail: {
                  target: event.target,
              },
          })
      );
  });
};

//  counts checked boxes within groups and sets a visual indicator
//  counts values printed from radio custom fields
const setPlanVisualIndicator = () => {
  const root = document.querySelector(
      ".accordion__grid.accordion__grid"
  );
  const selectors = [
      [".accordion"]
  ];

  if (!root) {
      return;
  }

  const getColumns = () => {
      return Array.from(
          document.querySelectorAll(".accordion__col[data-title]")
      );
  };

  const getSelectors = () => {
      return selectors.map((selector) => {
          return selector;
      });
  };

  const getSelectorNodeLists = ($selectors) => {
      return selectors.map((selector) => {
          return document.querySelectorAll(selector);
      });
  };
  //  this is done so that only css selectors are needed to perform the functionality, so as to add or remove rows from the accordion__grid without having to modify the code base
  const getLabels = ($getSelectorNodeLists) => {
      const labels = new Set();

      const labelsArray = getSelectorNodeLists().map((selector) => {
          return Array.from(selector).map((element) => {
              return labels.add(element.dataset.label);
          });
      });
      //
      return Array.from(labels);
  };

  const getGroups = ($getColumns, $getSelectors, $getLabels) => {
      const selectors = getSelectors(); // Array - strings
      const labels = getLabels(); // Array - strings

      const columns = getColumns().map((column) => {
          return selectors.map((selector) => {
              return labels.map((label) => {
                  return column.querySelectorAll(
                      `${selector}[data-label='${label}'] .accordion__content .accordion__value--radio`
                  );
              });
          });
      });

      const groups = new Array();
      columns.map((column) => {
          return column.map((selector) => {
              return groups.push(...selector);
          });
      });

      return groups;
  };

  const countGroupValues = ($getGroups) => {
      const groups = getGroups(); // Array - nodeLists;

      const setTitleIcon = (nodeList, string) => {
          const value = string;

          Array.from(nodeList).map((element) => {
              return (element
                  .closest(".accordion")
                  .querySelector(
                      ".accordion__title .accordion__value--radio"
                  ).dataset.value = value);
          });
      };

      const isFull = groups.map((group) => {
          const length = group.length;
          //
          const checkedRadios = Array.from(group).filter((element) => {
              return element.dataset.value === "full";
          }).length;
          //  due to 3 different visual indicators, the fn had to return a string
          if (checkedRadios == length) {
              return setTitleIcon(group, "full");
          }
          if (checkedRadios > 0 && checkedRadios < length) {
              return setTitleIcon(group, "half");
          }
          if (checkedRadios == 0) {
              return setTitleIcon(group, "empty");
          }
      });

      return isFull;
  };

  countGroupValues();
};

//  per mobile solution, grid shrinks to 1 col and you can toggle between the visible cols
const mobileSlider = () => {
  const root = document.querySelector(".archive__grid");
  //
  if (!root) {
      return;
  }
  //
  const getCardColumns = () => {
      return document.querySelectorAll(".archive__col");
  };
  //
  const getColumns = () => {
      return document.querySelectorAll(
          ".archive__col,.accordion__col"
      );
  };
  //
  const getToggleTargets = () => {
      return Array.from(getCardColumns()).map((element) => {
          return element.dataset.title && element.dataset.title;
      });
  };
  //
  const getActiveColumn = (type = "") => {
      return Array.from(getCardColumns()).find((column) => {
          return column.classList.contains("active");
      });
  };
  const setToggleTarget = (toggle = "") => {
      if (toggle == "previous") {
          let index = Array.from(getCardColumns()).indexOf(getActiveColumn());
          index = index - 1 < 0 ? getCardColumns().length - 1 : index - 1;
          return index;
      }
      if (toggle == "next") {
          let index = Array.from(getCardColumns()).indexOf(getActiveColumn());
          index = index + 1 > getCardColumns().length - 1 ? 0 : index + 1;
          return index;
      }
  };
  //
  const setActiveColumn = (activeByDefault = undefined) => {
      return Array.from(getColumns()).map((element) => {
          return element.dataset.title == activeByDefault ?
              element.classList.add("active") :
              element.classList.remove("active");
      });
  };
  //  this is done so that only css selectors are needed to perform the functionality, so as to add or remove rows from the accordion__grid without having to modify the code base
  const getLabels = (nodeList) => {
      return Array.from(nodeList).map((element) => {
          return element.dataset.label;
      });
  };
  //
  const addSlideToggles = (element, options = []) => {
      if (document.querySelector(".slider__toggles")) {
          return;
      }
      //
      const makeSlideToggles = () => {
          const makeBtn = ($element, $options) => {
              let btn = document.createElement("button");
              //
              if (!options) {
                  return btn;
              }
              //
              btn = options.map((element) => {
                  const btn = document.createElement("button");
                  btn.setAttribute("class", "slider__btn");
                  //
                  for (const [key, value] of Object.entries(element)) {
                      if (key !== "text") {
                          key != 'class' ? btn.setAttribute(key, value) : btn.classList.add(
                              ...value);
                      } else {
                          btn.appendChild(document.createTextNode(value));
                      }
                  }
                  //
                  return btn;
              });
              //
              return btn;
          };
          //
          const makeContainer = () => {
              const container = document.createElement("div");
              container.setAttribute("class", "slider__toggles");
              //
              makeBtn().map((btn) => {
                  return container.appendChild(btn);
              });
              //
              return container;
          };
          //
          const container = makeContainer();
          container.addEventListener("click", (event) => {
              event.target;
              const index = event.target.dataset.mkMobilesliderToggle;
              const title = Array.from(getCardColumns())[index].dataset.title;
              setActiveColumn(title);
              const toggles = document.querySelectorAll(
                  "[data-mk-mobileSlider-relation]"
              );
              //  dataset-relation determines where to go from current index, so:
              //  +1 means the next item in array
              //  -1 means the previous item in array
              Array.from(toggles).map((toggle) => {
                  return toggle.dataset.mkMobilesliderRelation == -1 ?
                      (toggle.dataset.mkMobilesliderToggle =
                          setToggleTarget("previous")) :
                      (toggle.dataset.mkMobilesliderToggle = setToggleTarget("next"));
              });
          });
          //
          return container;
      };
      //
      return element.prepend(makeSlideToggles());
  };
  //
  const removeElements = (elements) => {
      if (typeof elements === "string") {
          return Array.from(document.querySelectorAll(elements)).map((element) => {
              return element.remove();
          });
      }
  };
  //
  const initMobile = () => {
      root.addEventListener(
          "mk-viewport-mobile",
          (event) => {
              //  setActiveColumn("Basic");
              //  relation determines where to go from current index, so:
              //  +1 means the next item in array
              //  -1 means the previous item in array
              //  ===
              //  toggle flat out tells which index it is going to display
              //  toggle = '1' means getColumns()[1] = second column from the array of columns
              return addSlideToggles(root, [{
                      text: "",
                      "data-mk-mobileSlider-relation": "-1",
                      "data-mk-mobileSlider-toggle": setToggleTarget("previous"),
                      class: ['fa', 'fa-arrow-left'],
                  },
                  {
                      text: "",
                      "data-mk-mobileSlider-relation": "+1",
                      "data-mk-mobileSlider-toggle": setToggleTarget("next"),
                      class: ['fa', 'fa-arrow-right'],
                  },
              ]);
          }, {
              once: true,
          }
      );
      //
      return true;
  };
  //  this is done to enable carousel on mobile
  observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
          if (window.innerWidth < 768) {
              if (!document.querySelector(".slider__toggles")) {
                  initMobile();
              }
              root.dispatchEvent(new Event("mk-viewport-mobile"));
          } else {
              initMobile();
              removeElements(".slider__toggles");
          }
      });
  });
  //
  observer.observe(document.querySelector("body"));
  //
};

window.addEventListener('load', event => {
  mobileSlider();
  accordions();
  setPlanVisualIndicator();
  matchHeight(".archive__grid", [{
          classSelector: ".top",
      },
      {
          classSelector: ".middle",
          attribute: "data-double-dash",
      },
      {
          classSelector: ".bottom",
      },
      {
          classSelector: ".archive__title",
      },
      {
          classSelector: ".archive__thumb",
      },
      {
          classSelector: ".archive__price",
      },
      {
          classSelector: ".archive__info",
      },
      {
          classSelector: ".archive__services",
      },
      {
          classSelector: ".accordion__cell.archive__title",
      },
      {
          classSelector: ".accordion__title",
          attribute: "data-label",
      },
      {
          classSelector: ".accordion__content .accordion__cell",
          attribute: "data-label",
      },
  ]);
});
