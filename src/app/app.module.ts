import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { JwtInterceptor } from './interceptor/jwt.interceptor'
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ApiService } from './services/api.service'


@NgModule({
  declarations: [
    AppComponent
  ],
  
  imports: [
    BrowserModule, 
    HttpClientModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [
     ApiService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true // <-- Important: allows multiple interceptors
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }