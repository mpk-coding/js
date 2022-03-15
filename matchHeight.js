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
