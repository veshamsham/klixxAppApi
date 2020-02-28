import gulp from "gulp";
import gulpLoadPlugins from "gulp-load-plugins";
import path from "path";
import del from "del";
import runSequence from "gulp4-run-sequence";
import babelCompiler from "babel-core/register";
import * as isparta from "isparta";
import babel from "gulp-babel";
import { doesNotReject } from "assert";

const plugins = gulpLoadPlugins();

const paths = {
  js: ["./**/*.js", "!dist/**", "!node_modules/**", "!coverage/**"],
  nonJs: ["./package.json", "./**/*.ejs"],
  tests: "./server/tests/*.js"
};

const options = {
  codeCoverage: {
    reporters: ["lcov", "text-summary"],
    thresholds: {
      global: {
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 50
      }
    }
  }
};

// Clean up dist and coverage directory
gulp.task("clean", done => {
  console.log("Finally Reached Here");
  del.sync(["dist/**", "coverage/**", "!dist", "!coverage"]);
  done();
});

// Set env variables
gulp.task("set-env", () => {
  plugins.env({
    vars: {
      NODE_ENV: "test"
    }
  });
});

// Copy non-js files to dist
gulp.task("copy", () =>
  gulp
    .src(paths.nonJs)
    .pipe(plugins.newer("dist"))
    .pipe(gulp.dest("dist"))
);

// Compile ES6 to ES5 and copy to dist
gulp.task("babel", () =>
  gulp
    .src([...paths.js, "!gulpfile.babel.js"], { base: "." })
    .pipe(plugins.newer("dist"))
    .pipe(plugins.sourcemaps.init())
    .pipe(babel())
    .pipe(
      plugins.sourcemaps.write(".", {
        includeContent: false,
        sourceRoot(file) {
          return path.relative(file.path, __dirname);
        }
      })
    )
    .pipe(gulp.dest("dist"))
);

// Start server with restart on file changes
gulp.task(
  "nodemon",
  gulp.series(gulp.parallel("copy", "babel"), done => {
    plugins.nodemon({
      script: path.join("dist", "index.js"),
      ext: "js",
      ignore: ["node_modules/**/*.js", "dist/**/*.js"],
      tasks: ["clean", "copy", "babel"]
    });
    done();
  })
);

// covers files for code coverage
gulp.task("pre-test", () =>
  gulp
    .src([...paths.js, "!gulpfile.babel.js"])
    // Covering files
    .pipe(
      plugins.istanbul({
        instrumenter: isparta.Instrumenter,
        includeUntested: true
      })
    )
    // Force `require` to return covered files
    .pipe(plugins.istanbul.hookRequire())
);

// triggers mocha test with code coverage
gulp.task(
  "test",
  gulp.series(gulp.parallel("pre-test", "set-env"), () => {
    let reporters;
    let exitCode = 0;
    if (plugins.util.env["code-coverage-reporter"]) {
      reporters = [
        ...options.codeCoverage.reporters,
        plugins.util.env["code-coverage-reporter"]
      ];
    } else {
      reporters = options.codeCoverage.reporters;
    }

    return (
      gulp
        .src([paths.tests], { read: false })
        .pipe(plugins.plumber())
        .pipe(
          plugins.mocha({
            reporter: plugins.util.env["mocha-reporter"] || "spec",
            ui: "bdd",
            timeout: 11000,
            compilers: {
              js: babelCompiler
            }
          })
        )
        .once("error", err => {
          plugins.util.log(err);
          exitCode = 1;
        })
        // Creating the reports after execution of test cases
        .pipe(
          plugins.istanbul.writeReports({
            dir: "./coverage",
            reporters
          })
        )
        // Enforce test coverage
        .pipe(
          plugins.istanbul.enforceThresholds({
            thresholds: options.codeCoverage.thresholds
          })
        )
        .once("end", () => {
          plugins.util.log("completed !!");
          process.exit(exitCode);
        })
    );
  })
);

// clean dist, compile js files, copy non-js files and execute tests
gulp.task(
  "mocha",
  gulp.series(gulp.parallel("clean"), () => {
    runSequence(["copy", "babel"], "test");
  })
);

// gulp serve for development
gulp.task(
  "serve",
  gulp.series(done => {
    runSequence("nodemon");
    done();
  })
);

// default task: clean dist, compile js files and copy non-js files.
gulp.task(
  "default",
  gulp.series(done => {
    runSequence(["copy", "babel"]);
    done();
  })
);
