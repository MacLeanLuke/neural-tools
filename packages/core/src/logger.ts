import chalk from 'chalk';
import ora, { Ora } from 'ora';

export class Logger {
  private spinner: Ora | null = null;

  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  warn(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  }

  error(message: string): void {
    console.log(chalk.red('✗'), message);
  }

  debug(message: string): void {
    if (process.env.DEBUG) {
      console.log(chalk.gray('→'), message);
    }
  }

  startSpinner(message: string): void {
    this.spinner = ora(message).start();
  }

  succeedSpinner(message?: string): void {
    if (this.spinner) {
      this.spinner.succeed(message);
      this.spinner = null;
    }
  }

  failSpinner(message?: string): void {
    if (this.spinner) {
      this.spinner.fail(message);
      this.spinner = null;
    }
  }

  updateSpinner(message: string): void {
    if (this.spinner) {
      this.spinner.text = message;
    }
  }

  log(message: string): void {
    console.log(message);
  }

  newline(): void {
    console.log();
  }

  header(message: string): void {
    console.log();
    console.log(chalk.bold.cyan(message));
    console.log(chalk.cyan('─'.repeat(message.length)));
  }

  section(title: string, content: string[]): void {
    this.header(title);
    content.forEach(line => this.log(`  ${line}`));
    this.newline();
  }
}

export const logger = new Logger();
