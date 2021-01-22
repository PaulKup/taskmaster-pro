var tasks = {};

//taskEl is taskLi
var auditTask = function(taskEl) {
  // get date from task element
  var date = $(taskEl).find("span").text().trim();
  console.log(date);
  // convert to moment object at 5:00pm
  var time = moment(date, "L").set("hour", 17);
  // remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");
  // if current moment is after hour 17 on the due date for the taskEl apply new class
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger")
    // absolute value of number so we arent checking against a negative difference since the due date is some point in the future
  } else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning"); 
  }
}

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  //check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};
// task was clicked
$(".list-group").on("click", "p", function() {
  // get current text in task
  var text = $(this)
  .text()
  .trim();
  // create textarea for user to modify task
  var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);
  // swap <p> with <textarea>
  $(this).replaceWith(textInput);
  // automatically focus on <textarea>
  textInput.trigger("focus");
});

// value of task was changed
$(".list-group").on("blur", "textarea", function() {
  var text = $(this)
    .val()
    .trim();
  // get the parent ul's id attribute. all ul's have id's list-xxx where xxx is key in tasks obj
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");
  // get the task's position in the list of the other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();
  // update task in array and save to localstorage. what is .text??? when tasks are created the ul elemenet is made an object with task: and date: keys
  tasks[status][index].text = text;
  saveTasks();
  // recreate p element instead of textarea
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);
  $(this).replaceWith(taskP);
})

// due date was clicked
$(".list-group").on("click", "span", function() {
  // get current text. 'this' refers to span
  var date = $(this)
    .text()
    .trim();

  // create new input element
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);
   

  // swap out elements
  $(this).replaceWith(dateInput);
  // jquery ui datepicker
  dateInput.datepicker({
    minDate: 1
  });
  // automatically brings up the calendar
  dateInput.trigger("focus");
});

//value of date was changed
$(".list-group").on("change", "input[type='text']", function() {
  //get current text
  var date = $(this)
    .val()
    .trim();
  // get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");
  // get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();
  // update task in array and re-save to localstorage
  tasks[status][index].date = date;
  saveTasks();
  // recreate span element with bootstrap classes
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);
  // replace input with span element
  $(this).replaceWith(taskSpan);
  // pass task's <li> element into auditTask() to check new due date
  auditTask($(taskSpan).closest(".list-group-item"));
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
  // utilize datepicker() to bring up a calendar interface to select date
  $("#modalDueDate").datepicker({
    // date must at least be the next day
    minDate: 1,
    // upon close trigger the change event (in case they don't want to change the date so the element switches back to span)
    onClose: function() {
      $(this).trigger("change");
    }
  });
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-primary").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      // creates new object properties and sets them
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  // wtf is key if its initialized but not defined???
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();

// sets all ul's to sortable so drag and drop in enabled within and between the lists
$(".card .list-group").sortable({
  // connects the ul's to each other so drag drop can happen between lists
  connectWith: $(".card .list-group"),
  // disables scrolling when dragged element reaches window edge
  scroll: false,
  // default for dragged element to be considered 'over' another element is 50% of the element is intersecting but pointer changes it to when the cursor is over the element
  tolerance: "pointer",
  // ??? still unclear on this one
  helper: "clone",
  // same as dragstart and because lists are connected all of them activate and deactivate together
  activate: function(event) {
    //console.log("activate", this);
  },
  // dragstop
  deactivate: function(event) {
  //console.log("deactivate", this);
  },
  // detects the 'over' which is determined by tolerance: pointer
  over: function(event) {
    //console.log("over", event.target);
  },
  // when event is no longer 'over' a list either dragged out or dropped on
  out: function(event) {
    //console.log("out", event.target);
  },
  // when a list changes whether it be reordering or the removal or addition of a dragged element
  update: function(event) {
    // array to store task data
    var tempArr = [];
    // this refers to ul/ul's which was updated. each loops through all items in object/array and runs funtion on each item in this case the children of the ul the li
    $(this).children().each(function() {
      // this now refers to the object of the callback function which is now the li's (the children of the previous this)
      var text = $(this)
        // gets child DOM elements
        .find("p")
        // gets text contents of each element and their descendants (can also set the text contents of matched element)
        .text()
        // removes whitespace from beginning and end of string
        .trim();
      var date = $(this)
        .find("span")
        .text()
        .trim();
      // add task data to the temp array as an object
      tempArr.push({
        text: text,
        date: date
      });
    });
    // 'this' is ul which was updated.  strip first part of id from list so we are left with list name which matches what we called the list in the tasks object
    var arrName = $(this)
      .attr("id")
      .replace("list-", "");
    // update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();
  }
});

// makes the trash area droppable
$("#trash").droppable({
  // defines elements accepted to be dropped
  accept: ".card .list-group-item",
  // defines how the draggable element must overlap to be considered 'over' touch is any part of the elements touching
  tolerance: "touch",
  // event listener for when an element is dropped on trash. ui is an object with a property "draggable" which identifies the dropped element in the DOM.
  // remove removes the dropped element and since an element was removed from its original list the sortable update() is triggered which calls saveTasks() to update localStorage
  drop: function(event, ui) {
    ui.draggable.remove();
  },
  over: function(event, ui) {
    console.log("over");
  },
  out: function(event, ui) {
    console.log("out");
  }
});


