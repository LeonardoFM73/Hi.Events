<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('xendit_payments', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('order_id')->index();
            $table->string('invoice_id')->unique();
            $table->string('external_id')->unique();
            $table->string('status')->default('PENDING'); // PENDING, PAID, EXPIRED, FAILED
            $table->bigInteger('amount');
            $table->string('currency', 3)->default('IDR');
            $table->string('payment_method')->nullable(); // BANK_TRANSFER, E_WALLET, QRIS, etc
            $table->string('payment_channel')->nullable(); // BCA, BNI, MANDIRI, etc
            $table->string('payer_email')->nullable();
            $table->string('description')->nullable();
            $table->json('payment_details')->nullable();
            $table->json('last_error')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Foreign key
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('xendit_payments');
    }
};
