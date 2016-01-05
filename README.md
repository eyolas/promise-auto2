# Promise-auto

async's .auto() for promises

## Usage

### auto(tasks, [Promise])

__Arguments__

* `tasks` - An object. Each of its properties is either a function or an array of
  requirements, with the function itself the last item in the array. The object's key
  of a property serves as the name of the task defined by that property,
  i.e. can be used when specifying requirements for other tasks.
  The function receives one argument: a `results` object, containing the results of
  the previously executed functions.
* `Promise` - Using another Promise implementation

## sample
```js
var PromiseAuto = require('promise-auto2');
PromiseAuto({
  get_data: function(){
    console.log('in get_data');
    // async code to get some data
    return ['data', 'converted to array'];
  },
  make_folder: function(){
    console.log('in make_folder');
    // async code to create a directory to store a file in
    // this is run at the same time as getting the data
    // return 'folder';
    return new Promise((resolve) => {
      setTimeout(function() {
        resolve('folder');
      }, 5000);
    });
  },
  write_file: ['get_data', 'make_folder', function(results){
    console.log('in write_file', JSON.stringify(results), results);
    // once there is some data and the directory exists,
    // write the data to a file in the directory
    return 'filename';
  }],
  email_link: ['write_file', function(results){
    console.log('in email_link', JSON.stringify(results), results);
    // once the file is written let's email a link to it...
    // results.write_file contains the filename returned by write_file.
    return {'file':results.write_file, 'email':'user@example.com'};
  }]
})
.then(function(results) {
  console.log('results = ', results);
})
.catch(function(err) {
    console.log('err = ', err);
});
```

